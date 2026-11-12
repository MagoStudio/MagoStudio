export const MODEL_PROBE_SCRIPT = String.raw`
import sys, os, json, struct, traceback, gc, platform, re, inspect
request = json.loads(sys.argv[1])
action = request['action']
_dll_handles=[]
if os.name=='nt':
    import sysconfig
    for package in ('llama_cpp','torch'):
        directory=os.path.join(sysconfig.get_path('platlib'),package,'lib')
        if os.path.isdir(directory):
            _dll_handles.append(os.add_dll_directory(directory))
            os.environ['PATH']=directory+os.pathsep+os.environ.get('PATH','')

def init_llama_backends(llama_cpp):
    library_directory=os.path.join(os.path.dirname(llama_cpp.__file__),'lib')
    load_backends_from_path=getattr(llama_cpp,'ggml_backend_load_all_from_path',None)
    load_all_backends=getattr(llama_cpp,'ggml_backend_load_all',None)
    backend_load_error=None
    try:
        if load_backends_from_path and os.path.isdir(library_directory): load_backends_from_path(library_directory.encode())
        elif load_all_backends: load_all_backends()
    except Exception as e: backend_load_error=str(e)
    llama_cpp.llama_backend_init()
    return backend_load_error

def header(filename):
    with open(filename, 'rb') as f:
        def read(n):
            value = f.read(n)
            if len(value) != n: raise ValueError('Truncated model header')
            return value
        def number(fmt): return struct.unpack('<' + fmt, read(struct.calcsize('<' + fmt)))[0]
        def string():
            size = number('Q')
            if size > 16777216: raise ValueError('Model metadata string is too large')
            return read(size).decode('utf-8', errors='replace')
        if read(4) != b'GGUF':
            f.seek(0)
            size = number('Q')
            if size < 2 or size > 67108864: raise ValueError('Invalid safetensors header size')
            data = json.loads(read(size))
            payload_size=os.fstat(f.fileno()).st_size-8-size
            for key,tensor in data.items():
                if key=='__metadata__': continue
                shape,offsets=tensor.get('shape'),tensor.get('data_offsets')
                if not isinstance(shape,list) or not all(isinstance(d,int) and d>=0 for d in shape): raise ValueError('Invalid safetensors shape: '+key)
                if not isinstance(offsets,list) or len(offsets)!=2 or not all(isinstance(n,int) for n in offsets) or not 0<=offsets[0]<=offsets[1]<=payload_size: raise ValueError('Truncated or invalid safetensors data: '+key)
            tensors = {k: {'shape':v['shape'], 'dtype':v['dtype']} for k,v in data.items() if k != '__metadata__'}
            if not tensors: raise ValueError('Model contains no tensors')
            return {'format':'safetensors','metadata':data.get('__metadata__',{}),'tensors':tensors}
        version, count, kv = number('I'), number('Q'), number('Q')
        if version not in (2,3) or count < 1 or count > 1000000 or kv > 100000: raise ValueError('Unsupported GGUF header')
        scalar = {0:'B',1:'b',2:'H',3:'h',4:'I',5:'i',6:'f',7:'?',10:'Q',11:'q',12:'d'}
        def value(kind, keep=True):
            if kind == 8: return string()
            if kind == 9:
                sub, length = number('I'), number('Q')
                if length > 10000000: raise ValueError('GGUF array is too large')
                if sub in scalar:
                    f.seek(struct.calcsize('<' + scalar[sub]) * length, 1)
                else:
                    for _ in range(length): value(sub, False)
                return None
            if kind not in scalar: raise ValueError('Unsupported GGUF metadata type')
            return number(scalar[kind])
        metadata = {}
        for _ in range(kv):
            key, kind = string(), number('I')
            item = value(kind)
            if not key.startswith('tokenizer.') and isinstance(item,(str,int,float,bool)): metadata[key]=item
        tensors = {}
        for _ in range(count):
            name, dims = string(), number('I')
            if dims > 8: raise ValueError('Invalid GGUF tensor dimensions')
            shape = [number('Q') for _ in range(dims)]
            dtype, offset = number('I'), number('Q')
            tensors[name] = {'shape':shape,'dtype':dtype}
        return {'format':'gguf','metadata':metadata,'tensors':tensors}

def probe_runtime():
    result = {'python':sys.executable,'pythonVersion':platform.python_version(),'platform':sys.platform,'machine':platform.machine()}
    import importlib.metadata
    result['packages']={}
    for package in ('torch','torchvision','torchaudio','llama-cpp-python'):
        try: result['packages'][package]=importlib.metadata.version(package)
        except importlib.metadata.PackageNotFoundError: pass
    try:
        import ctypes
        driver=ctypes.WinDLL('nvcuda.dll') if sys.platform=='win32' else ctypes.CDLL('libcuda.so.1')
        version,major,minor=ctypes.c_int(),ctypes.c_int(),ctypes.c_int()
        if driver.cuInit(0)==0 and driver.cuDriverGetVersion(ctypes.byref(version))==0:
            driver.cuDeviceComputeCapability(ctypes.byref(major),ctypes.byref(minor),0)
            result.update(cudaDriverVersion=version.value,cudaCapability=[major.value,minor.value])
    except Exception: pass
    try:
        import torch
        available = torch.cuda.is_available()
        result.update(torchVersion=torch.__version__, torchCudaVersion=torch.version.cuda, torchGpu=available, gpuName=torch.cuda.get_device_name(0) if available else None, gpuCapability=list(torch.cuda.get_device_capability(0)) if available else None, metal=bool(hasattr(torch.backends,'mps') and torch.backends.mps.is_available()))
        if available:
            free,total=torch.cuda.mem_get_info()
            result.update(vramFree=free,vramTotal=total)
    except Exception as e: result['torchError']=str(e)
    try:
        import llama_cpp
        backend_load_error=init_llama_backends(llama_cpp)
        if backend_load_error: result['llamaBackendLoadError']=backend_load_error
        result.update(llamaVersion=llama_cpp.__version__,llamaGpu=bool(llama_cpp.llama_supports_gpu_offload()),llamaSystem=llama_cpp.llama_print_system_info().decode('utf-8', errors='replace'))
    except Exception as e: result['llamaError']=str(e)
    return result

def comparison_tensors(model):
    tensors=model['tensors']
    # ComfyUI's diffusion loader removes this checkpoint namespace. The
    # supported MiniMax Singularity export includes it; Comfy-Org does not.
    # Only normalize a complete main-model namespace, never arbitrary keys
    # or encoder/VAE/LoRA components.
    prefix='model.diffusion_model.'
    if request.get('model')=='minimax' and request.get('role')=='main' and model['format']=='safetensors' and all(k.startswith(prefix) for k in tensors):
        return {k[len(prefix):]:v for k,v in tensors.items()}
    return tensors

try:
    if action == 'runtime':
        result = {'status':'success','message':'Runtime probe completed','details':probe_runtime()}
    elif action == 'compatibility':
        candidate = header(request['path'])
        baseline = header(request['reference']) if request.get('reference') and os.path.isfile(request['reference']) else None
        details = {'format':candidate['format'],'metadata':candidate['metadata'],'tensorCount':len(candidate['tensors'])}
        if request.get('model') == 'text':
            architecture=candidate['metadata'].get('general.architecture')
            embedding=candidate['metadata'].get(str(architecture)+'.embedding_length')
            blocks=candidate['metadata'].get(str(architecture)+'.block_count')
            prediction_layers=candidate['metadata'].get(str(architecture)+'.nextn_predict_layers',0)
            # Supported exports can include one additional prediction layer.
            # It is counted in GGUF block_count, not in the 64 base layers.
            if architecture != 'qwen35' or embedding != 5120 or prediction_layers not in (0,1) or blocks != 64 + prediction_layers:
                result={'status':'mismatch','message':'Expected Qwen 27B qwen35 architecture with embedding width 5120 and 64 base layers (optionally one prediction layer)','details':details}
            else: result={'status':'success','message':'Architecture and embedding shape match. Runtime loading is a separate check.','details':details}
        if request.get('role') == 'lora':
            result={'status':'unknown','message':'LoRA rank and target layers can differ from the recommended file. Test this candidate with the selected base model before using it.','details':details}
        elif (request.get('model')!='text' or result['status']=='success') and baseline and baseline['format'] == candidate['format']:
            left,right=comparison_tensors(baseline),comparison_tensors(candidate)
            common=set(left)&set(right)
            comparable=common if candidate['format']=='gguf' else {k for k in common if left[k]['dtype'] in ('F32','F16','BF16') and right[k]['dtype'] in ('F32','F16','BF16')}
            mismatches=[{'tensor':k,'expected':left[k]['shape'],'actual':right[k]['shape']} for k in sorted(comparable) if left[k]['shape'] != right[k]['shape']]
            details['comparedTensors']=len(comparable)
            if mismatches:
                details['mismatches']=mismatches[:12]
                result={'status':'mismatch','message':'Tensor shape mismatch against the recommended component','details':details}
            elif len(common) < max(len(left),len(right)) * 0.5:
                result={'status':'mismatch','message':'The candidate tensor signature belongs to a different component or architecture','details':details}
            elif not comparable:
                result={'status':'unknown','message':'Headers are valid, but the tensor signatures cannot be verified. Test this candidate with the installed loader.','details':details}
            else: result={'status':'success','message':'Comparable tensor shapes match. Quantization support and memory fit require a load test.','details':details}
        elif request.get('model')!='text': result={'status':'unknown','message':'A comparable recommended file is unavailable. Run a candidate load test before selecting this file.','details':details}
    elif action == 'load':
        if request['model'] == 'text':
            import llama_cpp
            backend_load_error=init_llama_backends(llama_cpp)
            if request['options']['layers'] != 0 and not llama_cpp.llama_supports_gpu_offload(): raise RuntimeError('GPU offload is requested, but the installed llama.cpp backend is CPU only. Repair the runtime or select CPU mode.'+(' Loading the GPU backend failed: '+backend_load_error if backend_load_error else ''))
            from llama_cpp import Llama
            options=request['options']
            flash_attention_option={'flash_attn_type':1} if 'flash_attn_type' in inspect.signature(Llama.__init__).parameters else {'flash_attn':True}
            model=Llama(model_path=request['path'],n_gpu_layers=options['layers'],n_ctx=options['context'],n_batch=options['batch'],n_ubatch=min(options['batch'],1024),offload_kqv=options['offloadCache'],use_mmap=options['memoryMap'],type_k=8,type_v=8,verbose=True,**flash_attention_option)
            model.close()
        else:
            root=request['root']
            os.chdir(root)
            sys.path.insert(0,root)
            sys.argv=['main.py','--disable-auto-launch']
            if request.get('memoryPolicy')=='low-vram': sys.argv.append('--lowvram')
            import comfy.options
            comfy.options.enable_args_parsing()
            import asyncio, inspect, nodes, server
            from comfy import model_management
            loop=asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            if 'asset_manager' in inspect.signature(server.PromptServer).parameters:
                from app.assets.manager import default_asset_manager
                prompt_server=server.PromptServer(loop,default_asset_manager())
            else: prompt_server=server.PromptServer(loop)
            config=os.path.join(root,'extra_model_paths.yaml')
            if os.path.isfile(config):
                import utils.extra_config
                utils.extra_config.load_extra_path_config(config)
            import folder_paths
            for category,folders in request.get('categories',{}).items():
                for folder in folders: folder_paths.add_model_folder_path(category,folder)
            loop.run_until_complete(nodes.init_extra_nodes(init_custom_nodes=True,init_api_nodes=False))
            loader=request['loader']
            cls=nodes.NODE_CLASS_MAPPINGS.get(loader)
            if cls is None: raise ValueError('Required loader is missing: '+loader)
            inputs=request['inputs']
            schema=cls.INPUT_TYPES()
            for key,spec in {**schema.get('required',{}),**schema.get('optional',{})}.items():
                if key in inputs: continue
                choices=spec[0]
                options=spec[1] if len(spec)>1 and isinstance(spec[1],dict) else {}
                if 'default' in options: inputs[key]=options['default']
                elif isinstance(choices,list) and choices: inputs[key]=choices[0]
            if 'model' in schema.get('required',{}) and 'model' not in inputs:
                base=nodes.NODE_CLASS_MAPPINGS[request['baseLoader']]
                base_inputs=request['baseInputs']
                if request['baseLoader']=='UNETLoader': base_inputs['weight_dtype']='default'
                inputs['model']=getattr(base(),base.FUNCTION)(**base_inputs)[0]
            loaded=getattr(cls(),cls.FUNCTION)(**inputs)
            if request.get('role')=='lora' and not getattr(loaded[0],'patches',{}): raise ValueError('LoRA tensor keys did not match the selected base model')
            if request.get('role')=='main':
                config=getattr(getattr(loaded[0],'model',None),'model_config',None)
                actual=type(config).__name__.lower()
                expected={'qwen-image':'qwenimage','qwen-edit':'qwenimage','flux':'flux2','minimax':'minimax'}[request['model']]
                if expected not in actual: raise ValueError('Loaded model architecture '+actual+' does not match expected '+expected)
            for item in loaded:
                patcher=item if hasattr(item,'model_size') else getattr(item,'patcher',None)
                if patcher is not None: model_management.load_models_gpu([patcher])
            del loaded
            model_management.unload_all_models()
            gc.collect()
        result={'status':'success','message':'Component load test passed. Generation and combined workflow memory have not been tested.'}
    else: raise ValueError('Unknown probe action')
except Exception as e:
    trace=traceback.format_exc()
    result={'status':'error','message':str(e),'details':{'kind':'gpu-memory' if re.search(r'out of memory|cudaMalloc|failed to allocate.*(?:CUDA|GPU)',trace,re.I) else 'load-failure','trace':trace[-16000:]}}
print('MAGO_MODEL_RESULT='+json.dumps(result,ensure_ascii=True))
`;
