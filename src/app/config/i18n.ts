import i18n from "i18next";
import { initReactI18next } from "react-i18next";

void i18n.use(initReactI18next).init({
  lng: "en",
  fallbackLng: "en",
  interpolation: {
    escapeValue: false
  },
  resources: {
    en: {
      translation: {
        localSetup: {
          pill: {
            label: "Local setup",
            labelWithProgress: "Local setup {{percentage}}%"
          },
          existingComfy: {
            title: "Using your own ComfyUI",
            checking: "Checking ComfyUI and setup…",
            vfxLoras: {
              title: "Optional: MiniMax H3 VFX LoRAs",
              description:
                "VFX edit, Head swap, Character swap and Style transfer each load their own LoRA. Download every missing one into one folder in a single step.",
              downloadAllMissing: "Download all missing ({{count}})",
              downloadingAll: "Downloading {{count}} LoRAs…",
              pause: "Pause",
              retry: "Resume / retry",
              savedTo:
                "Saved to {{folder}}. Check setup again after ComfyUI refreshes its model list."
            }
          },
          hardware: {
            graphicsCard: "Graphics card",
            videoMemory: "Video memory",
            systemMemory: "Memory",
            checkingValue: "Checking…",
            checkingTitle: "Checking your hardware…",
            readyTitle: "Your computer can run Mago locally",
            continue: "Continue",
            limitedTitle: "Mago will run, with limits",
            limitedDescription:
              "Your graphics card has {{videoMemory}} of video memory. Smaller models run here. Larger ones stay on Mago cloud.",
            continueAnyway: "Continue anyway",
            useCloud: "Use Mago cloud",
            blockedTitle: "This computer can't run Mago locally",
            blockedDescription:
              "Local rendering needs an NVIDIA graphics card with at least 8 GB of video memory. You can still render everything on Mago cloud."
          },
          storage: {
            insufficientTitle: "Not enough space on {{drive}}",
            insufficientDescription:
              "You need {{required}} GB. This drive has {{free}} GB free.",
            insufficientHint:
              "Free up {{missing}} GB, or pick a drive with more room.",
            chooseAnotherDrive: "Choose another drive",
            checkAgain: "Check again",
            title: "Where should Mago keep the engine?",
            description:
              "ComfyUI, starter models and temporary extraction files need {{required}} GB.",
            driveGroupLabel: "Destination drive",
            freeSpace: "{{free}} GB free",
            chooseFolder: "Use another folder",
            continue: "Continue"
          },
          licenses: {
            title: "Model licenses",
            description:
              "Mago Studio runs open-weight models on your computer. Each model is subject to its author's license. By accepting, you use these models at your own discretion. Mago Cloud models are still available for commercial use.",
            listLabel: "Model licenses",
            accept: "Accept"
          },
          welcome: {
            title: "Render on this computer",
            description:
              "Mago downloads ComfyUI, MiniMax video models and Qwen-VL captioning. You can add local text and image models in the next steps, or keep using Mago cloud for them.",
            hardwareLabel: "1  Hardware check",
            hardwareEstimate: "About 10 seconds",
            modelsLabel: "2  Models",
            modelsEstimate: "Pick what to install",
            storageLabel: "3  Storage",
            storageEstimate: "From {{gigabytes}} GB",
            downloadLabel: "4  Download",
            downloadEstimate: "From {{count}} files",
            useExistingComfy: "I already have ComfyUI",
            installComfy: "I don't have ComfyUI installed"
          },
          models: {
            title: "Choose what to install",
            description:
              "The minimal install renders video. Add the other groups now or later from Update installation.",
            listLabel: "Model groups",
            groups: {
              minimal: {
                name: "Minimal",
                description:
                  "ComfyUI, MiniMax H3 video with its 8 step HD and VFX LoRAs, and Qwen3-VL captioning."
              },
              "minimax-h3-draft-lora": {
                name: "MiniMax H3 2 step draft",
                description:
                  "The fastest MiniMax H3 LoRA, for checking framing and motion. Audio is weaker."
              },
              "minimax-h3-turbo-lora": {
                name: "MiniMax H3 4 step turbo",
                description:
                  "A faster MiniMax H3 LoRA, with less detail than 8 step HD."
              },
              "local-llm": {
                name: "Local LLM",
                description:
                  "Qwen3.8 27B for script and prompt writing. Q5 or Q3, picked from your video memory."
              },
              "qwen-image": {
                name: "Qwen Image",
                description: "Qwen Image 2512 for sheets and stills."
              },
              "flux-image": {
                name: "Flux Image",
                description: "Flux 2 Klein 4B for sheets and stills."
              }
            },
            size: "{{gigabytes}} GB",
            alwaysInstalled: "Always installed",
            installed: "Installed",
            updateAvailable: "Update available",
            continue: "Continue",
            loadError: "Unable to read which models are installed.",
            startFailed: "Unable to start the download.",
            insufficientSpace:
              "You need {{required}} GB in the Mago install folder. It has {{free}} GB free."
          },
          updateInstallation: {
            label: "Update installation",
            tooltip: "This model isn't installed yet. Add it to your setup."
          },
          download: {
            installingDependencies: "Installing node pack dependencies..."
          },
          comfyRestart: {
            description:
              "New node packs load after ComfyUI restarts. Restart it when no render needs it.",
            busyWarning_one:
              "ComfyUI has {{count}} render running or queued. Restarting stops it.",
            busyWarning_other:
              "ComfyUI has {{count}} renders running or queued. Restarting stops them.",
            restart: "Restart ComfyUI",
            restarting: "Restarting ComfyUI...",
            waitingForRestart: "Installed. Restart ComfyUI below to load it.",
            restartAnyway: "Restart ComfyUI anyway",
            restarted:
              "ComfyUI restarted with the new node packs. Setup was checked again.",
            restartYourself:
              "Restart ComfyUI to load the new node packs. Mago can't restart this ComfyUI: it has no ComfyUI-Manager, and Mago doesn't know its install folder.",
            restartStatusUnknown:
              "Restart ComfyUI to load the new node packs. Mago couldn't check whether it can restart it for you."
          },
          requirementDownload: {
            savedNodePack:
              "Saved to {{savedTo}}. Pinned node pack SHA-256 verified and extracted with CRC checks.",
            savedModel:
              "Saved to {{savedTo}}. Check setup again after ComfyUI refreshes its model list."
          },
          nodePackUpdate: {
            title: "Update this node pack?",
            outdated:
              "{{nodePackName}} is installed, but it isn't the version Mago needs.",
            steps:
              "Mago downloads the pinned version to a temporary folder first. Once that succeeds, it moves the current folder to the backup folder and installs the new one.",
            installedFolder: "Installed folder",
            backupFolder: "Backup folder",
            cancel: "Cancel",
            confirm: "Update node pack"
          },
          nodePackDependencies: {
            installed: "Its Python dependencies were installed.",
            noRequirements: "It has no Python dependencies.",
            manual:
              "Mago couldn't find the Python that runs your ComfyUI. Run this command with that Python, then restart ComfyUI:",
            copyCommand: "Copy command",
            failed:
              "The node pack is in place, but installing its Python dependencies failed. Fix the error, run this command, then restart ComfyUI:",
            rowHint:
              "Download and extract into {{folder}}. Mago extracts the pack and installs its Python dependencies when it finds the Python that runs ComfyUI. Then restart ComfyUI."
          },
          steps: {
            welcome: "Welcome",
            hardware: "Hardware check",
            models: "Models",
            storage: "Storage",
            licenses: "Licenses",
            download: "Download"
          },
          stepCounter: "Step {{current}} of {{total}} · {{name}}",
          skipStep: "Next (for team test)",
          skipToFakeDownload: "Next (fake download)",
          collapse: "Collapse setup",
          back: "Back",
          comfyLaunch: {
            label: "Launch ComfyUI",
            launching: "Launching ComfyUI...",
            timeout:
              "ComfyUI was launched but has not responded yet. Check the installation and try again.",
            tooltip: "ComfyUI isn't running. Launch it to render locally.",
            launchedProcessExited:
              "ComfyUI closed while starting (exit code {{exitCode}}). Your graphics card or drivers may not be supported, or the install may be damaged. Run the setup again to check.",
            reportedFailureReason: "ComfyUI reported: {{reason}}",
            unknownExitCode: "—",
            dialog: {
              launchingTitle: "Starting ComfyUI",
              launchingDescription:
                "Mago is starting ComfyUI from your local install. This usually takes under a minute.",
              startingProcess: "Starting the ComfyUI process…",
              checkProgress_one:
                "Checked {{count}} time · next check in {{seconds}}s",
              checkProgress_other:
                "Checked {{count}} times · next check in {{seconds}}s",
              elapsed: "{{elapsed}} / {{limit}}",
              failedTitle: "ComfyUI didn't start",
              timedOutDescription:
                "ComfyUI didn't respond within {{minutes}} minutes. Retry restarts it. If it keeps failing, run the setup again to repair your install.",
              launchErrorDescription:
                "Mago couldn't start ComfyUI. Run the setup again to repair your install.",
              launchErrorFallback: "The ComfyUI launcher failed to start.",
              cancel: "Cancel",
              retry: "Retry"
            }
          },
          setupMagoStudio: {
            label: "Setup Mago Studio",
            tooltip: "To render locally, you need to finish the setup."
          },
          debugSetting: {
            label: "Setup wizard debug tools",
            description:
              "Shows Back, Next (fake download) and the show-all-missing preview in the setup wizard."
          },
          localRenderBlocked: {
            setupUnfinished: "To render locally, you need to finish the setup.",
            comfyStopped: "ComfyUI is installed. Launch it to render locally."
          }
        },
        localSettings: {
          title: "Local settings",
          openButtonAriaLabel: "Open local library settings",
          saving: "Saving settings...",
          signOutConfirm: "Sign out of Mago cloud?",
          errors: {
            checkComfy: "Unable to check ComfyUI",
            openSettings: "Unable to open settings",
            useFolder: "Unable to use folder",
            saveComfyEndpoint: "Unable to save ComfyUI endpoint",
            signIn: "Unable to sign in"
          },
          hints: {
            endpointUnchecked: "Leave this field to check the endpoint.",
            comfyNotResponding:
              "ComfyUI is not responding. Start it or finish local setup.",
            connectComfyFirst: "Connect ComfyUI above to check this model.",
            textModelMissing:
              "Missing or unavailable: {{missing}}. Install these through local setup, then restart ComfyUI.",
            textModelUnverified:
              "Unable to verify the selected text model. Select it again to retry.",
            cloudTextNeedsSignIn:
              "Sign in to Mago to use cloud text generation. Otherwise it falls back to the local text model."
          },
          tabs: {
            account: "Account",
            models: "Models",
            general: "General",
            needsAttention: "Needs attention"
          },
          statusMark: {
            checking: "{{label}}: checking",
            ready: "{{label}}: ready",
            needsAttention: "{{label}}: needs attention",
            checkingProgress: "Checking {{label}}"
          },
          account: {
            heading: "Account",
            signedInFallback: "Signed in",
            signInPrompt:
              "Sign in to use cloud rendering, credits and your subscription.",
            signIn: "Sign in to Mago",
            signOut: "Sign out"
          },
          models: {
            heading: "ComfyUI",
            description:
              "Qwen Image Edit, local Wan video renders and Qwen3-VL captioning all run through this ComfyUI API. No API key is required.",
            comfyNeeded:
              "Set a responding ComfyUI endpoint before using local ComfyUI models.",
            endpointLabel: "API endpoint",
            endpointAriaLabel: "ComfyUI API endpoint",
            textModelLabel: "Text model",
            textModelCloud: "Gemini (Mago cloud)",
            textModelQwenQ3: "Qwen3.8 27B Q3 (local, lower memory)",
            textModelQwenQ5: "Qwen3.8 27B Q5 (local, higher quality)"
          },
          general: {
            heading: "Project folder",
            noLibrary: "No local library selected",
            changeFolder: "Change folder",
            chooseFolder: "Choose folder",
            showInFolder: "Show in folder",
            description:
              "Mago stores its project database and generated thumbnails here. Source videos stay in their original locations.",
            sceneTimelineLabel: "Scene timeline",
            sceneTimelineDescription:
              "Shows a card for each scene at the top of the Scenes tab, for jumping to it.",
            advancedHeading: "Advanced"
          }
        },
        projectFolders: {
          sections: {
            thisWeek: "This week",
            previous30Days: "Previous 30 days",
            january: "January",
            february: "February",
            march: "March",
            april: "April",
            may: "May",
            june: "June",
            july: "July",
            august: "August",
            september: "September",
            october: "October",
            november: "November",
            december: "December"
          }
        },
        documentation: {
          path: "https://www.notion.so/magostudio/User-onboarding-Welcome-to-Mago-Alpha-version-6fcbcef6bf1b4d65abffe07aa8154680"
        },
        status: {
          still_in_progress: { label: "Still in progress" },
          clip_is_rendering: { label: "Clip is Rendering" },
          clip_is_rendering_left: { label: "left" },
          next: { label: "Next" },
          in_queue: { label: "In Queue" },
          in_queue_next: { label: "In Queue: Next" },
          not_available: { label: "Not available" },
          error: { label: "Error" },
          failed: { label: "Failed" },
          paused: { label: "Paused" },
          starting: { label: "Starting" },
          done: { label: "Done" },
          cancelled: { label: "Cancelled" },
          processing_video: { label: "Processing video" },
          processing_failed: { label: "Processing failed" },
          loading: { label: "Loading" },
          in_progress: { label: "In progress" },
          unknown_error: { label: "Unknown error" },
          timeout: { label: "Timeout" },
          processing: { label: "Processing" },
          encoding: { label: "Encoding" },
          finalizing: { label: "Finalizing" },
          uploading: { label: "Uploading" },
          syncing: { label: "Syncing…" },
          syncing_projects: {
            label: "Syncing projects · {{completed}}/{{total}}"
          },
          downloading_offline: {
            label: "Downloading for offline use · {{ready}}/{{total}}"
          },
          waiting_download: { label: "Waiting to download" },
          downloading_asset: { label: "Downloading" },
          retry_download: { label: "Retry download" },
          loading_image: { label: "Loading image" },
          loading_video: { label: "Loading video" },
          loading_credits: { label: "Loading credits and subscription" },
          loading_project_preview: { label: "Loading project preview" },
          shared: { label: "(shared)" },
          pinned_track_empty: {
            label: "Pin a track in your project to see it here"
          }
        },
        plans_panel: {
          title: { label: "Plans" },
          section_in_progress: { label: "In progress" },
          section_ended: { label: "Ended" }
        },
        app_sidebar: {
          home: { label: "Home" },
          navigation: { label: "Main navigation" },
          collapse: { label: "Collapse sidebar" },
          expand: { label: "Expand sidebar" }
        },
        project_types: {
          timeline: {
            label: "Video to Video",
            description:
              "Restyle your own footage and add VFX, shot by shot or in bulk."
          },
          script_to_shots: {
            label: "Mago Director",
            description:
              "Turn an idea into a script, cast it, and render every scene."
          }
        },
        credits_menu: {
          open: { label: "Open credits menu" },
          credits_mode: { label: "Credits mode" },
          relaxed_mode: { label: "Relaxed mode" },
          unlimited_mode: { label: "Unlimited mode" },
          upgrade: { label: "Upgrade" }
        },
        home_tools: {
          title: { label: "Tools" }
        },
        upcoming_tools: {
          coming_soon: { label: "Coming soon" },
          generate_image: {
            label: "Generate image",
            description: "Upload an image and restyle it with any image model."
          },
          generate_video: {
            label: "Generate video",
            description: "Animate a still image into a video clip."
          }
        },
        projects_by_type: {
          empty_state: { description: "No projects of this type yet." }
        },
        new_users_paywall: {
          title: {
            label:
              "You've run out of free credits. Choose a plan to keep rendering"
          },
          best_offer: { label: "Best offer" },
          per_month: { label: "per month" },
          learn_more: { label: "Learn more" },
          buy_credits: { label: "Buy credits" },
          subscribe: { label: "Subscribe" },
          navbar_subscribe: { label: "Subscribe now" },
          discount_note: {
            label: "pay only {{price}} on your first month as a new user"
          },
          free: {
            name: { label: "Pay as you go" },
            subtitle: { label: "Your current plan" },
            price: { label: "€0" },
            line_1: { label: "Buy credits as you go" }
          },
          pro: {
            name: { label: "PRO" },
            subtitle: { label: "Best for the app discovery" },
            free_renders_bold: { label: "Free renders" },
            free_renders_rest: { label: " on Mago Models" },
            simultaneous_note: { label: "— max. 2 simultaneous" }
          },
          studio: {
            name: { label: "Studio" },
            subtitle: { label: "Unleash Mago power" },
            free_renders_bold: { label: "Free renders" },
            free_renders_rest: {
              label: " on all models incl. Kling, Seedance, etc.."
            },
            simultaneous_note: { label: "— max. 3 simultaneous" }
          }
        },
        queue_panel: {
          title: { label: "Queue" },
          section_in_progress_plans: { label: "In progress plans" },
          section_in_progress: { label: "In progress" },
          section_waiting: { label: "Waiting" },
          section_completed: { label: "Completed" },
          empty_in_progress: { label: "No jobs" },
          empty_waiting: { label: "No jobs are waiting" },
          history_notice: {
            label: "We are keeping history for 3 days"
          },
          duration: { label: "Duration: {{value}}" },
          frame_range: { label: "Frame range: {{start}}—{{end}}" },
          cost: { label: "Cost: {{value}}" },
          stop_render_confirmation: {
            description:
              "The render {{name}} will be stopped and deleted from the render queue."
          },
          stop_render: { label: "Stop now" },
          open_project: { label: "Open project" },
          delete_render: { label: "Delete" }
        },
        hints: {
          privacy_notice:
            "Mago does not use your content to train its models. Your videos are private and are not shared outside of your projects."
        },
        actions: {
          open_mago: { label: "Now open Mago" },
          use_template_video: { label: "Use template video {{number}}" },
          use_this_prompt: { label: "Use this prompt" },
          go_back_to_source_video: { label: "Back to original video" },
          video_preupload_modal_confirm: { label: "Trim and upload" },
          open_stylizer: { label: "Open stylizer" },
          upload_my_frame: { label: "Upload my frame" },
          frame_range_preset_full: {
            label: "Full"
          },
          frame_range_preset_one_second: {
            label: "1 sec."
          },
          frame_range_preset_group: {
            ariaLabel: "Frame range preset"
          },
          run_stylization: {
            label: "Generate {{ startFrameNumber }}–{{ endFrameNumber }}"
          },
          run_stylization_area: {
            label: "Generate area {{ startFrameNumber }}–{{ endFrameNumber }}"
          },
          run_test: { label: "Test" },
          play_video: { label: "Play video" },
          pause_video: { label: "Pause video" },
          toggle_crop: { label: "Toggle crop selection" },
          reset_zoom: { label: "Reset zoom" },
          toggle_fullscreen: { label: "Toggle fullscreen" },
          mute_sound: { label: "Mute sound" },
          unmute_sound: { label: "Unmute sound" },
          no_sound_on_track: { label: "This track has no sound" },
          close_fullscreen: { label: "Close fullscreen" },
          resize_crop_top_left: { label: "Resize crop from top left" },
          resize_crop_top_right: { label: "Resize crop from top right" },
          resize_crop_bottom_left: { label: "Resize crop from bottom left" },
          resize_crop_bottom_right: {
            label: "Resize crop from bottom right"
          },
          upload_stylized_frame: { label: "Upload stylized frame" },
          stylize_frame: { label: "Modify frame" },
          confirm: "Confirm",
          switch_to_free: { label: "Switch to Free plan" },
          switch_to_beginner: { label: "Switch to Beginner plan" },
          upgrade: {
            label: "Upgrade"
          },
          top_up_credits: {
            label: "Top up credits"
          },
          downgrade: {
            label: "Downgrade"
          },
          contact_us: {
            label: "Contact us"
          },
          subscribe_again: {
            label: "Subscribe again"
          },
          addStyleReferenceImage: { label: "Add style reference image" },
          optimize_prompt: { label: "Optimize prompt" },
          undo: { label: "Undo" },
          back_to_project: { label: "Back to project" },
          back_to_project_escape: { label: "Back to project (Escape)" },
          try_another_video: { label: "Try another video" },
          modify_frames: { label: "Modify frames" },
          download_sbs_video: { label: "Download side-by-side video" },
          download_with_info: { label: "Download with info" },
          download_pinned: { label: "Download pinned" },
          download_as_png: { label: "Download as PNG" },
          download_as_exr: { label: "Download as EXR" },
          copy_render_settings: { label: "Copy render settings" },
          reset_settings: { label: "Reset", description: "" },
          buy_credits: { label: "Buy credits", description: "" },
          back_to_plans: { label: "Back to page" },
          checkbox: { label: "Enable" },
          select_all_matching_objects: {
            label: "Select all matching objects"
          },
          cancel: { label: "Cancel" },
          bulk_delete_shots: { label: "Delete selected shots" },
          confirm_rename: { label: "Confirm rename" },
          pin_track: { label: "Pin track" },
          pin_a_render: { label: "Pin a render" },
          add: { label: "Add" },
          try_again: { label: "Try Again" },
          renew_plan: { label: "Renew plan" },
          update_card_info: { label: "Update card info" },
          choose_picture: { label: "Choose picture" },
          copy_settings: { label: "Copy", ariaLabel: "Copy settings" },
          paste_settings: { label: "Paste", ariaLabel: "Paste settings" },
          create_image: { label: "Create image" },
          set_as_favorite: { label: "Set as favorite" },
          single_view: { label: "Single view" },
          overlay_view: { label: "Overlay view" },
          side_by_side_view: { label: "Side by side view" },
          create_new_project: { label: "Create a project" },
          create_project: { label: "Create project" },
          all_projects: { label: "Show all" },
          sort_alphabetically: { label: "Alphabetically" },
          sort_ascending: { label: "Sort ascending" },
          sort_descending: { label: "Sort descending" },
          delete_project: { ariaLabel: "Delete project" },
          folder_stats: { label: "Folder stats" },
          new_folder: { label: "Add folder" },
          sort_alphabetical: { label: "Alphabetical" },
          sort_last_edited: { label: "Date created" },
          search_projects: {
            label: "Search",
            placeholder: "Search"
          },
          delete: { label: "Delete" },
          retry: { label: "Retry" },
          dismiss: { label: "Dismiss" },
          share: { label: "Share" },
          delete_it_anyway: { label: "Delete it anyway" },
          dont_show_again: { label: "Don't show again", description: "" },
          download: { label: "Download", description: "" },
          zoom_in: { label: "Zoom in" },
          zoom_out: { label: "Zoom out" },
          duplicate_settings: { label: "Duplicate settings", description: "" },
          generate_image: { label: "Generate image", description: "" },
          generate_my_video: { label: "Generate my video", description: "" },
          play_tutorial: { label: "Play tutorial video", description: "" },
          generate_frame: { label: "Generate frame", description: "" },
          generate: { label: "Generate", description: "" },
          setup_local_render: { label: "Set up local render" },
          go_back: { label: "Back" },
          continue: { label: "Continue" },
          hide_all_hints: { label: "Hide all hints", description: "" },
          hide_details: { label: "Hide details", description: "" },
          iterate: { label: "Iterate", description: "" },
          loading_process: { label: "Loading..." },
          open_discord: { label: "Open Discord" },
          send_me_home: { label: "Send me home" },
          payment_flow_back_to_my_projects: { label: "Back to my projects" },
          payment_flow_buy_some_credits: { label: "Buy some credits" },
          payment_flow_buy_this: { label: "Buy now" },
          payment_flow_price_per_second: {
            label: "≈ {{currencySymbol}}{{price}} per second"
          },
          payment_flow_details_videos: "videos (1 second, 720p, 30 fps)",
          payment_flow_details_images: "images (1280x720 px)",
          payment_flow_switch_to_credits: { label: "Switch to credits" },
          reset_override: { label: "Reset" },
          reset_all_overrides: { label: "Reset all overrides" },
          reset_onboarding: { label: "Reset onboarding" },
          price_details: { label: "Price details", description: "" },
          test: { label: "Test", description: "" },
          subscribe: { label: "Subscribe", description: "" },
          to_my_projects: { label: "To my projects" },
          tweak_it: { label: "Load settings", description: "" },
          upload_image: { label: "Upload image" },
          use_this: { label: "Use this", description: "" },
          use_this_frame_as: {
            label: "Use this frame as:",
            description:
              "By default, this frame will be used as the first frame for the selected range, but you can choose any frame to use as the reference frame. This can be useful if your character isn't visible in the first frames of your clip"
          },
          first_frame: { label: "First frame" },
          select_frame: { label: "Select frame" },
          watch_video: { label: "Watch video" },
          open_youtube: { label: "Open YouTube" },
          unsubscribe_me: { label: "Yes, unsubscribe" },
          update_billing_info: { label: "Update billing info" },
          its_fine: { label: "It's fine" },
          select_range: { label: "Range" },
          create_new_track: { label: "Create new track" },
          apply_preset: { label: "Apply preset" },
          share_project: { label: "Share" },
          bulk_import: { label: "Bulk import" },
          upload_video: { label: "Upload video" },
          add_video: { label: "Add video" },
          generate_with_ai: { label: "Generate with AI" },
          create_folder: { label: "Create folder" },
          close: { label: "Close" },
          toggle_presets_list: { label: "Toggle presets list" }
        },
        buttonTooltips: {
          preview_button_one: { label: "One video" },
          preview_button_split: { label: "Split view slider" },
          preview_button_compare: { label: "Compare two video tracks" },
          crop_toggle_button: {
            label: "Draw a crop to render only that area"
          },
          zoom_reset_button: { label: "Reset" },
          fullscreen_viewport_button: {
            label: "Open fullscreen viewport"
          },
          download_sbs_video_button: {
            label: "Download side-by-side comparison video"
          },
          download_sbs_video_button_disabled: {
            label:
              "Select a single finished render track to download comparison video"
          },
          download_sbs_video_button_cropped: {
            label: "Comparison video is not available yet for cropped renders"
          },
          disclosure_settings_panel_button: {
            label: "Show or hide settings"
          },
          nav_credits_button: {
            label: "Credit Balance, click to add more"
          },
          like_button: {
            label: "Mark a result"
          },
          add_to_prompt_button: {
            label: "Paste all description to prompt"
          },
          use_this_button: {
            label: "Select this image for video generation",
            disabledTooltip:
              "You can't use this image directly for the currently selected model"
          },
          tweak_it_button: {
            disabledTooltip: "This model is no longer available"
          },
          pin_to_global_preview: {
            label: "Pin to global preview",
            disabledTooltip: "Only finished renders can be pinned"
          },
          reuse_settings: {
            label: "Re-use settings"
          },
          iterate_render: {
            label: "Edit this render"
          },
          download_video_button: {
            label: "Download clip"
          },
          to_source_button: {
            label: "To Source",
            tooltip: "Select the source video used to create this render",
            deleted_tooltip:
              "Source track has been deleted and is not available anymore"
          },
          click_to_rename_button: {
            label: "Click to rename"
          },
          generated_img2img_preview_button: {
            label: "Click to zoom"
          },
          create_image_button: {
            label: "Generate a stylized frame (img2img)"
          },
          paste_disabled_completed_render: {
            label: "You cannot paste into a completed render"
          },
          copy_all_info: { label: "Copy app info" },
          copy_section: { label: "Copy section" },
          copy_all_debug_info: { label: "Copy all" }
        },
        titles: {
          or: {
            label: "or"
          },
          tutorial_script_to_movie: {
            label: "How to go from a script to a movie with Mago"
          },
          tutorial_iterating_on_renders: {
            label: "Mago Tutorial | Iterating on Renders & Building in Passes"
          },
          tutorial_compare_renders: {
            label: "Mago Tutorial | Compare Renders Side by Side"
          },
          onboarding_upload: {
            label: "Pick a video to begin editing:",
            or_upload: "Or upload your own file",
            description: "Drag and drop or click to upload your file",
            hint: "You can use video format .mp4 or .mov"
          },
          onboarding_questionnaire: {
            name: {
              title: "Tell us a bit more about yourself",
              first_name: "First name",
              last_name: "Last name"
            },
            profession: {
              title: "What is your line of work?",
              subtitle: "This helps us personalize the app to your needs",
              "2d_animation": "2D animation",
              "3d_animation": "3D animation",
              vfx: "VFX",
              vertical_drama: "Vertical Drama",
              social_media_content: "Social media content",
              other: "Other",
              other_placeholder: "Tell us what you do"
            },
            referral_source: {
              title: "How did you hear about Mago?",
              instagram: "Instagram",
              youtube: "Youtube",
              linkedin: "Linkedin",
              google: "Google",
              friend: "From a friend",
              tiktok: "Tiktok"
            }
          },
          onboarding_image_step: {
            label: "Describe how you'd like to change your video",
            default_prompt: "Cover everything in snow"
          },
          onboarding_stylize_header: {
            label:
              "The first step in modifying your video is to stylize one frame"
          },
          onboarding_style_reference: {
            label: "Add style reference or character"
          },
          onboarding_use_this_hint: {
            label: "Click here to use this image as your reference"
          },
          onboarding_render_prompt: {
            placeholder: "Describe the changes you want to apply to your video",
            default_prompt: "Cover everything in snow"
          },
          onboarding_render_sending: {
            label:
              "Describe in the prompt what you want to change in the video, supporting your new frame"
          },
          onboarding_render_frame_edited: {
            label: "Edited frame"
          },
          onboarding_render_frame_input: {
            label: "Input"
          },
          onboarding_render_apply_to: {
            label: "Apply to"
          },
          onboarding_render_done: {
            label:
              "Your onboarding is Done and your render was sent to the Queue, we will inform you with a sound when it's done! For that, allow Mago to send you in-browser notifications."
          },
          onboarding_tutorial: {
            label: "While you wait learn more about Mago powers"
          },
          trim_your_video: {
            label: "Trim your video"
          },
          video_upload_limit: {
            label: "The current limit is 1 minute"
          },
          or_use_template_video: {
            label: "Or use one of our videos"
          },
          maintenance: {
            label:
              "Mago is under maintenance. Head over to our Discord to learn more"
          },
          cloud_maintenance: {
            label: "Mago cloud is under maintenance."
          },
          crash_page: {
            label: "Something went wrong! Our rescue team is on the way"
          },
          frame_modification: {
            label: "Frame modification"
          },
          generate_images: {
            label: "Generated images"
          },
          input_track_selector: {
            label: "Selected input track"
          },
          render_settings: {
            label: "Settings"
          },
          settings_view: {
            label: "Render info"
          },
          technical_settings: {
            label: "Technical settings"
          },
          quality_settings: {
            label: "Quality settings"
          },
          advanced_settings: {
            label: "Advanced settings"
          },
          mask_settings: {
            label: "Mask settings"
          },
          other_settings: {
            label: "Other settings"
          },
          scheduled_from: {
            label: "Scheduled"
          },
          changes_after: {
            label: "After {{date}} you will be switched to {{plan}} plan"
          },
          relaxed: { label: "Relaxed" },
          unlimited_mode: { label: "Unlimited" },
          relaxed_mode: { label: "Relaxed" },
          reference_images: {
            label: "Images (jpg or png)",
            description:
              "Upload up to 2 reference images for Kling video generation"
          },
          reference_image_slot: {
            label: "Image {{number}}",
            labelTag: "@Image{{number}}",
            first_angle: "First angle",
            second_angle: "Second angle",
            elementTag: "@Element{{number}}",
            pictureTag: "Picture {{number}}"
          },
          no_mask: { label: "No mask" },
          mask_input: { label: "Mask input" },
          discord_community: { label: "Discord community" },
          discord: { label: "discord" },
          email: { label: "email" },
          how_to_work_with_settings: { label: "How to work with settings" },
          youtube_tutorials: { label: "Check our YouTube tutorials" },
          frame_range: { label: "Frame range", description: "" },
          generation_cost: { label: "Generation cost", description: "" },
          modal_video_tutorial: { label: "Mago tutorial video" },
          my_projects: { label: "My projects" },
          all_projects_modal: { label: "All Projects" },
          project_modal: { label: "Project" },
          drag_drop_files: {
            label: "Drag or drop your video files here to get started",
            description:
              "You can upload multiple files at once. We can create one folder for all files or a separate folder for each file. Add file to select the uploading option."
          },
          untitled_project: { label: "Untitled" },
          onboarding_sticker_title: { label: "How to" },
          project_loading: { label: "Project" },
          project_loading_date: { label: "00.00.00" },
          project_loading_subtitle: { label: "x renders, x images" },
          folder_stats: { label: "Folder stats" },
          project_stats: { label: "Project stats" },
          project_stats_total_renders: { label: "Total renders" },
          project_stats_success_rate: { label: "Success rate" },
          project_stats_render_details: { label: "Render details" },
          project_stats_total_frames: { label: "Total frames" },
          project_stats_total_cost: { label: "Total cost" },
          project_stats_total_time: { label: "Total time rendered" },
          project_stats_avg_time_per_frame: { label: "Avg. time per frame" },
          project_stats_model_info: { label: "Model info" },
          project_stats_most_used_model: { label: "Most used model" },
          project_stats_successful_renders: { label: "Successful renders" },
          project_stats_avg_cost_per_frame: { label: "Avg. cost per frame" },
          project_stats_avg_cost_per_second: { label: "Avg. cost per second" },
          project_stats_earliest_render: { label: "Earliest render" },
          project_stats_latest_render: { label: "Latest render" },
          project_stats_models_used: { label: "Models used" },
          project_stats_queue_wait_time: { label: "Queue wait time" },
          project_stats_individual_renders: { label: "Individual renders" },
          project_stats_frames: { label: "Frames" },
          project_stats_resolution: { label: "Resolution" },
          project_stats_fps: { label: "FPS" },
          project_stats_model: { label: "Model" },
          project_stats_render_time: { label: "Render time" },
          project_stats_cost: { label: "Cost" },
          input_video_resolution: { label: "Resolution" },
          input_video_ratio: { label: "Aspect Ratio" },
          input_video_duration: { label: "Duration" },
          input_video_fps: { label: "FPS" },
          input_video_total_frames: { label: "Total frames" },
          renders_count: {
            label: "{{count}} render",
            label_other: "{{count}} renders"
          },
          shots_count: {
            label: "{{count}} shot",
            label_other: "{{count}} shots"
          },
          payment_flow_credits_page_kicker: {
            label: "of rendered video in 1080p"
          },
          payment_flow_credits_page_subtitle: {
            label: "1000 credits is about 6 seconds"
          },
          our_plans_and_credits: {
            label: "Our plans and credits"
          },
          pricing: {
            label: "Pricing",
            sales_label: "Pricing"
          },
          pricing_page: {
            heading: "Let\u2019s build together",
            subheading:
              "Our experts will help you design a solution that fits your scale, budget, and technical requirements",
            hint: "No model training is performed. No data is sent anywhere else. If you delete your project, it\u2019s permanently deleted",
            faq_title: "Frequently asked questions",
            custom_solutions_badge: "CUSTOM SOLUTIONS",
            custom_solutions_title: "Mago Enterprise",
            custom_solutions_description:
              "Unlock the full potential of Mago with a bespoke plan tailored to your organization\u2019s volume and technical requirements.",
            checklist_item_1: "Build Your AI Production Pipeline",
            checklist_item_2: "White-glove implementation & support",
            checklist_item_3:
              "Maintain visual consistency and creative ownership across shows, sequences",
            checklist_item_4: "Render Queue and Process Management",
            checklist_item_5: "Production Workflow Acceleration",
            checklist_item_6: "Your files are secure in our cloud",
            faq_q1: "How does Mago integrate into existing pipelines?",
            faq_a1:
              "Mago slots directly into your current VFX and post-production pipeline. Our team works with you to connect Mago to your asset management, review tools, and render infrastructure so adoption is seamless.",
            faq_q2: "How do you handle confidentiality and IP protection?",
            faq_a2:
              "Your data stays yours. We never use client assets for model training, all files are encrypted at rest and in transit, and projects are permanently deleted when you remove them. We can also sign custom NDAs and DPAs.",
            faq_q3: "What does custom model training include?",
            faq_a3:
              "We fine-tune our base models on your specific style guides, brand assets, and reference footage so the output matches your creative vision from the start \u2014 no lengthy prompt engineering required.",
            faq_q4: "What does a typical pilot engagement look like?",
            faq_a4:
              "A pilot usually runs 2\u20134 weeks. We onboard your team, configure Mago for a representative project, and measure quality, speed, and cost savings against your current workflow before scaling up."
          },
          best_offer: {
            label: "Best offer"
          },
          payment_flow_current_amount_of_credits: {
            label: "Current amount of credits"
          },
          payment_flow_history_of_purchases: { label: "History of purchases" },
          payment_flow_not_enough_credits: { label: "Not enough credits?" },
          payment_flow_payment_page_title: { label: "Billing info" },
          payment_flow_per_credit: { label: "per credit" },
          setting_name: { label: "Setting name", description: "" },
          test_cost: { label: "Test cost", description: "" },
          total_amount: { label: "Total amount", description: "" },
          queue: { label: "Queue", description: "" },
          create: { label: "Create" },
          preview: { label: "Preview" },
          allProjects: { label: "All projects", description: "" },
          modal_generate_image_from_frame: {
            label: "Generate a stylized frame (img2img)"
          },
          generated_images: {
            label: "Generated images"
          },
          frame_number: {
            label: "Frame number"
          },
          no_generated_images: {
            label: "No images have been generated yet"
          },
          img2img_empty_state: {
            no_modified_frames_yet: "No modified frames yet",
            guidance:
              "To change your video, first make changes to a single frame using a prompt or an image reference, you could use some prompt examples:",
            recommended_model_prefix: "Recommended model:",
            preset_cinematic_illustrated: {
              title: "Cinematic illustrated style",
              recommended_model: "GPT Image 2",
              prompt: "Cinematic illustrated style, gritty fantasy realism."
            },
            preset_change_weather: {
              title: "Change the weather",
              recommended_model: "GPT Image 2",
              prompt:
                "Change the weather to a snow scene, keep the composition of the original image"
            },
            preset_clean_plate: {
              title: "Make a clean plate",
              recommended_model: "GPT Image 2",
              prompt: "Make a clean plate"
            }
          },
          image_settings: {
            label: "Image settings"
          },
          no_projects_yet: {
            label: "No projects yet"
          },
          no_results_found: {
            label: "No results found"
          },
          video_preupload_modal_title: {
            label: "Trim and upload only the part you need"
          },
          video_preupload_modal_subtitle: {
            label: "The current limit is 1 minute"
          },
          video_preupload_modal_trim_instruction: {
            label: "Choose the section of the video you'd like to keep"
          },
          subscriptions: {
            label: "Plans"
          },
          credits: {
            label: "Credits"
          },
          current_plan: {
            label: "Current plan"
          },
          monthly_subscription: {
            label: "Monthly subscription"
          },
          free_plan: {
            label: "Free"
          },
          free_forever: {
            label: "free forever"
          },
          beginner_plan: {
            label: "Beginner (obsolete)"
          },
          pro_plan: {
            label: "Pro"
          },
          studio_plan: {
            label: "Studio"
          },
          enterprise: {
            label: "Enterprise"
          },
          buy_credits_for_your_plan: {
            label: "Buy credits for your plan"
          },
          expires: {
            label: "Expires"
          },
          expired: {
            label: "Expired"
          },
          model: {
            label: "Model",
            description: "Select the model to use for the image generation"
          },
          projects: {
            label: "Projects"
          },
          shots: {
            label: "Shots"
          },
          project_view: {
            label: "Project view"
          },
          render_video: {
            label: "Render video"
          },
          upscale: {
            label: "Upscale"
          },
          mask: {
            label: "Mask"
          },
          modify_frame: {
            label: "Modify frame"
          },
          global_timeline: {
            label: "Global timeline"
          },
          plan_tab: {
            label: "Plan"
          },
          edit_frame: {
            label: "Edit frame"
          },
          my_account: {
            label: "My account"
          },
          local_settings: {
            label: "Settings"
          },
          account_info: {
            label: "Account info"
          },
          subscriptions_and_credits: {
            label: "Subscriptions and credits"
          },
          billing_info: {
            label: "Billing info"
          },
          sign_out: {
            label: "Sign out"
          },
          app_info: { label: "App Info" },
          debug_info: { label: "Debug Info" },
          commit_hash: { label: "Commit" },
          build_time: { label: "Built" },
          backend_url: { label: "Backend" },
          backend_version: { label: "API Version" },
          app_version: { label: "App Version" },
          local_app_version: {
            label: "Mago Studio {{version}} ({{commitHash}})"
          },
          feature_flags: { label: "Feature Flags" },
          browser_info: { label: "Browser" },
          dev_overrides: { label: "Dev Overrides" },
          subscription_override: { label: "Subscription Override" },
          legacy_user_override: { label: "Legacy User" },
          created_at_override: { label: "Created At" },
          force_non_team_member_override: { label: "Force Non-Team Member" },
          mock_onboarding_incomplete_override: {
            label: "Mock onboarding incomplete"
          },
          force_onboarding_complete_override: {
            label: "Force onboarding done"
          },
          force_onboarding_enabled_override: {
            label: "Force onboarding enabled"
          },
          relaxed_day_pct_override: { label: "Mode daily usage %" },
          relaxed_day_reset_override: { label: "Mode daily reset" },
          relaxed_week_pct_override: { label: "Mode weekly usage %" },
          relaxed_week_reset_override: { label: "Mode weekly reset" },
          override_none: { label: "None" },
          user_subscription: { label: "User & Subscription" },
          current_project: { label: "Current Project" },
          app_environment: { label: "App & Environment" },
          user_id: { label: "User ID" },
          user_email: { label: "Email" },
          credit_balance: { label: "Credits" },
          reserved_credits: { label: "Reserved" },
          subscription_status: { label: "Subscription" },
          renders_in_progress: { label: "Renders" },
          project_id: { label: "Project ID" },
          shot_id: { label: "Shot ID" },
          track_ids: { label: "Track IDs" },
          asset_id: { label: "Asset ID" },
          filepath: { label: "Filepath" },
          queue_id: { label: "Queue ID" },
          user_agent: { label: "User Agent" },
          help_button: {
            shortcut: "Keyboard shortcuts",
            support: "Contact support",
            discord: "Get help on Discord"
          },
          keyboard_shortcuts_title: "Keyboard shortcuts",
          modifier_key_mac: "Cmd",
          modifier_key_win: "Ctrl",
          toggle_settings_action: "Open close setting panel",
          toggle_settings_key: "Shift+S",
          play_action: "Play video",
          play_key: "Space",
          beginning_action: "Move to the beginning of clip",
          beginning_key: "Double click on track",
          tracks_action: "Switch tracks",
          tracks_key: "Arrows UP/Down",
          frames_action: "Switch frames",
          frames_key: "Arrows Left/Right",
          compare_action: "Select and compare multiple tracks",
          compare_key: "{{modifierKey}}+Click on track"
        },
        notifications: {
          cloud_sign_in_failed: {
            description: "Unable to open sign-in. Please try again."
          },
          error: {
            description: "Something went wrong. Please try again."
          },
          cloud_sync_project: {
            description: "Preparing cloud project…"
          },
          cloud_sync_asset: {
            description: "Preparing video…"
          },
          cloud_sync_encoding: {
            description: "Encoding video…"
          },
          cloud_sync_uploading: {
            description: "Uploading video…"
          },
          cloud_sync_ingesting: {
            description: "Processing video…"
          },
          questionnaire_save_failed: {
            label: "Something went wrong saving your answers. Please try again."
          },
          video_above_4k: {
            description:
              "Video is above 4k, download it to get the uncompressed file"
          },
          upload_in_progress_warning: {
            description: "Please do not close the tab while video is uploading"
          },
          secure_payments_by: {
            description: "Secure payments by"
          },
          cancel_anytime: {
            description: "Cancel anytime • Visa, MasterCard, UnionPay & more"
          },
          enjoy_early_access: {
            description:
              "Enjoy early access pricing while we're in closed beta — things will change once we launch"
          },
          you_need_to_add_the_ff_to_work_with_V3: {
            description: "You need to add the first frame to work with V3"
          },
          are_you_sure: {
            description: "Are you sure?"
          },
          img2img_use_this_replaces_crop: {
            description:
              "This shot already has a crop. Using this image will replace it with the crop of the generated image."
          },
          img2img_use_this_removes_crop: {
            description:
              "This generated image has no crop. Using it will remove the crop currently set on this shot."
          },
          confirm_delete_folder: {
            description: "You are about to delete the folder: {{name}}"
          },
          confirm_delete_shot_folder: {
            description:
              "You are about to delete: {{name}}. This action cannot be undone."
          },
          bulk_delete_shots: {
            description:
              "You're about to delete {{count}} shots and their renders. Are you sure? This action can't be undone."
          },
          bulk_delete_shots_and_project: {
            description:
              "You're about to delete the last {{count}} shots and their renders. This will also delete the project. Are you sure? This action can't be undone."
          },
          confirm_delete_project: {
            description:
              'You are about to delete the project "{{name}}". This action cannot be undone.'
          },
          copied_to_clipboard: {
            description: "Copied to your clipboard"
          },
          settings_copied_to_clipboard: {
            description: "Settings copied to clipboard"
          },
          info_copied: {
            description: "App info copied to clipboard"
          },
          settings_pasted_successfully: {
            description: "Settings pasted successfully"
          },
          pasted: {
            description: "Pasted"
          },
          failed_to_paste_settings: {
            description: "Failed to paste settings"
          },
          clipboard_is_empty: {
            description: "Your clipboard is empty"
          },
          nothing_to_copy: {
            description: "Nothing to copy"
          },
          failed_to_copy_to_clipboard: {
            description: "Failed to copy to clipboard"
          },
          failed_to_copy_settings: {
            description: "Failed to copy settings"
          },
          selected_track_is_locked: {
            description:
              "The selected track is locked, but you can duplicate all the settings"
          },
          settings_reused: {
            description:
              "The render settings have been pasted to the settings editor."
          },
          settings_pasted: {
            description: "Settings have been pasted"
          },
          we_were_unable_to_charge_the_card: {
            description: "We were unable to charge the card"
          },
          unfortunately_we_were_unable_to_charge_the_card: {
            description:
              "Unfortunately, we were not able to charge your card. Please check your payment details or try another payment method. You will be moved to the free plan as soon as your current subscription ends, starting"
          },
          unfortunately_we_were_unable_to_charge_the_card_expired: {
            description:
              "Unfortunately, we were not able to charge your card. Please check your payment details or try another payment method. Your subscription ended and access was switched to the Free plan on"
          },
          subscription_will_remain_active_until: {
            description:
              "Your subscription will remain active until {{ expirationDate }}. After that, you\u2019ll be moved to the Free plan. Any unused credits from your {{ currentPlan }} plan will carry over to your Free plan."
          },
          buy_credits_rendering_priority: {
            description:
              "Credits give you rendering priority, you don't have to wait for other users to finish rendering"
          },
          current_plan: {
            description: `You have access to the interface and you previous renders, works only with credits. To render you need to buy and spend credits. The subscription includes a one-time bonus of {{creditsCount}} free credits.`
          },
          beginner_plan: {
            description:
              "Get unlimited renders, in a slow mode. You can also buy additional credits and work in regular mode."
          },
          pro_plan: {
            description:
              "Get 15,000 monthly credits and get unlimited renders, in a slow mode. You can also buy additional credits and work in regular mode."
          },
          project_quota_reached: {
            description: "You have reached the maximum number of projects"
          },
          project_create_failed: {
            description: "Couldn't create the project. Please try again."
          },
          onboarding_template_error: {
            description: "Couldn't start from this video. Please try again."
          },
          create_project_upload_video: {
            label: "",
            description: "To start working, create a project and upload a video"
          },
          queue_completed_renders: {
            label: "Completed renders",
            description:
              "Render history will be automatically deleted if it's older than 3 days"
          },
          queue_empty: {
            description:
              "Hey, it's been a while since your last render — missing the magic?"
          },
          upload_image_file: {
            description: "Drag and drop or click to upload image"
          },
          upload_video_file: {
            description: "Drag and drop or click to upload video file"
          },
          drag_drop_upload_file: {
            description: "Drag and drop or click to upload"
          },
          use_image_format: {
            description: "You can use image format .jpg or .png"
          },
          use_image_format_short: {
            description: "Format .jpg or .png"
          },
          upload_files: {
            label: "Upload files",
            description: "You can use image format .jpg or .png"
          },
          use_video_format: {
            description: "You can use video format .mp4 or .mov"
          },
          upload_button_notification: {
            description:
              "You can use MP4 or MOV. Videos larger than 1GB cannot be uploaded — try trimming your clip before uploading"
          },
          upload_button_notification_image_file_format: {
            description:
              "We don't support this file format yet. You can use JPG or PNG"
          },
          upload_button_notification_image_large_file: {
            description: "The file size is more than 50 MB"
          },
          upload_button_image_input_limits: {
            description:
              "Image input is too big.\nPlease upload an image between 300px and 5600px, and under 50 MB"
          },
          upload_button_image_input_too_small: {
            description:
              "Image is too small. Please upload an image between 300px and 5600px, and under 50 MB"
          },
          upload_button_image_input_too_big: {
            description:
              "Image is too big. Please upload an image between 300px and 5600px, and under 50 MB"
          },
          upload_button_file_empty: {
            description: "The file is empty"
          },
          upload_button_file_corrupted: {
            description: "The file is broken"
          },
          upload_button_file_read_error: {
            description: "Error reading file. The file might be too large"
          },
          two_angle_uploader_missing_image: {
            description: "Please add second image to create Element"
          },
          render_generation_failed: {
            description: "Generation failed. Please try again."
          },
          failed_to_create_track: {
            description: "Could not create the track. Please try again."
          },
          bulk_renders_run_launch_failed: {
            description: "Could not start the bulk render. Please try again."
          },
          bulk_renders_run_cancel_failed: {
            description: "Could not cancel the bulk render. Please try again."
          },
          bulk_renders_run_resume_failed: {
            description: "Could not resume the bulk render. Please try again."
          },
          bulk_renders_run_auto_prompt_unavailable: {
            description: "No description is available for this Shot yet."
          },
          optimize_prompt_failed: {
            description: "Could not optimize the prompt. Please try again."
          },
          adapt_prompt_failed: {
            description: "Could not adapt the prompt. Please try again."
          },
          adapt_prompt_partial: {
            description:
              "Some references could not be resolved. Please review the prompt."
          },
          image_to_video_setup_failed: {
            description:
              "Could not set up the image-to-video space. Please try again."
          },
          image_to_video_create_shot_failed: {
            description:
              "Could not create a shot from this render. Please try again."
          },
          upload_cancel_confirm: {
            description:
              "Your video upload is still in progress. If you leave now, the upload will be cancelled and any progress will be lost."
          },
          upload_button_file_processing_error: {
            description: "Error. Convert to MP4 and try again"
          },
          upload_button_network_error_412: {
            description:
              "Error 412: Network issues, please try again or use a different video. If the problem persists, contact us on Discord or at hello@mago.studio"
          },
          upload_button_processing_error_422: {
            description:
              "Error 422: Processing failed. Please try again. if the error persists, please contact us on Discord or at hello@mago.studio"
          },
          drawer_settings_no_parameters_to_show: {
            description: "No parameters to show"
          },
          hint_weve_added_credits_to_your_account: {
            description:
              "We've added {{defaultCredits}} credits to your account as a welcome gift. Enjoy Mago!"
          },
          hint_press_duplicate_button: {
            description:
              "If you would like to change settings of this track press Duplicate button."
          },
          hint_learn_how_to_work_with_settings: {
            description: "Learn how to work with settings in 2 minute video."
          },
          hint_here_you_can_see_all_your_recent_queues: {
            description: "Here you can see all your recent queues."
          },
          hint_ready_to_start_your_project: {
            description: "Ready to start your project?"
          },
          hint_create_render_track: {
            description:
              "Create render track from this video by clicking on stars button."
          },
          hint_with_range_tool_select_desire_number_of_frames: {
            description: "With range tool select desire number of frames."
          },
          hint_learn_how_to_side_by_side_tracks: {
            description:
              "Learn how to side by side tracks with their settings difference."
          },
          hint_double_click_on_track_to_place_playhead: {
            description:
              "Double click on track to place playhead at the first frame."
          },
          hint_double_click_to_rename: {
            description: "Double click to rename."
          },
          hint_copy_settings_between_projects: {
            description: "Copy settings between projects."
          },
          hint_prompt_doesnt_influence_the_result: {
            description: `Prompt doesn't influence the result? With "Image weight" at 1, the prompt will have little impact. Lower the "Image weight" before increasing the "CFG".`
          },
          hint_style_from_the_image_doesnt_influence_the_result: {
            description: `Style from the image doesn't influence the result? Try increasing the "Output size" or decrease the Tile controleNet.`
          },
          hint_how_to_refine_the_style_image_reference: {
            description:
              'How to refine the style image reference – You can style the first frame of your video and upload it as your "Image style reference" for better results.'
          },
          hint_too_much_flickering_max_size: {
            description: 'Too much flickering? Increase "Output size".'
          },
          hint_too_much_flickering_steps: {
            description: 'Too much flickering? Add more "Steps".'
          },
          hint_too_much_flickering_tile: {
            description:
              "Too much flickering? Increase the weight of the Tile ControlNet."
          },
          hint_weird_elements_appearing_prompt: {
            description:
              "Weird elements appearing? Add a more descriptive prompt."
          },
          hint_weird_elements_appearing_tile: {
            description:
              "Weird elements appearing? Increase the weight of Tile & Canny ControlNets."
          },
          hint_weird_elements_appearing_max_size: {
            description: 'Weird elements appearing?  Increase "Output size".'
          },
          hint_all_articles_are_available_here: {
            description:
              "All articles and support resources are available here."
          },
          payment_flow_canceled_redirection: {
            description: "You will be redirected to the payment page"
          },
          payment_flow_canceled: {
            description:
              "Your payment has been canceled. No charges were made to your account."
          },
          payment_flow_checkout_session_error: {
            description: "Failed to create checkout session. Please try again."
          },
          payment_flow_error: {
            description: "An error occurred. Please try again later."
          },
          your_subscription_is_working_now: {
            description: "Your subscription is working now"
          },
          payment_flow_success_redirection: {
            description: "You will be redirected to the main page"
          },
          payment_flow_success: {
            description:
              "Your credit coins are ready to use — spend them wisely! Or recklessly. I'm just a message, not your financial advisor"
          },
          payment_flow_relaxed_mode_render_limit_video: {
            description_one:
              "In Relaxed mode, you can render only {{count}} video at a time. If you want to render more at once, switch to Credits",
            description_other:
              "In Relaxed mode, you can render only {{count}} videos at a time. If you want to render more at once, switch to Credits"
          },
          payment_flow_relaxed_mode_render_limit_image: {
            description_one:
              "In Relaxed mode, you can render only {{count}} image at a time. If you want to render more at once, switch to Credits.",
            description_other:
              "In Relaxed mode, you can render only {{count}} images at a time. If you want to render more at once, switch to Credits."
          },
          comfy_not_running: {
            description: "ComfyUI is not running. Launch it to render locally."
          },
          local_setup_required: {
            description: "To render locally, you need to finish the setup."
          },
          payment_flow_relaxed_mode_model_restriction: {
            description: "This model is not available in Relaxed mode"
          },
          payment_flow_daily_limit_reached: {
            description_one:
              "You've reached your daily limit. It resets in {{count}} hour. You can still render using credits",
            description_other:
              "You've reached your daily limit. It resets in {{count}} hours. You can still render using credits"
          },
          payment_flow_weekly_limit_reached: {
            description_one:
              "You've reached your weekly limit. It resets in {{count}} hour. You can still render using credits",
            description_other:
              "You've reached your weekly limit. It resets in {{count}} hours. You can still render using credits"
          },
          payment_flow_relaxed_usage_tooltip: {
            description: "{{pct}}% Used"
          },
          payment_flow_subscription_not_active: {
            description:
              "Your subscription is not active. Please subscribe or renew to continue rendering."
          },
          payment_flow_unlimited_not_available: {
            description: "This mode is not available on your current plan."
          },
          payment_flow_unable_to_access_portal: {
            description: "Unable to access portal. Please try again later."
          },
          model_not_available_in_mode: {
            description: "{{modelName}} is not available in {{mode}} mode"
          },
          preview_area_your_render_is_here: {
            description: "Your render is here, hooray!"
          },
          preview_select_track_with_ctrl_click: {
            description: "Select a track with Ctrl or Cmd + Click"
          },
          render_queue_confirmation: {
            description:
              "Render will be sent to queue in 5 seconds. It can't be canceled or refunded afterwards.",
            cancel: "Cancel render",
            submit: "Send it right now"
          },
          preview_area_current_frame_outside_of_range: {
            description: "Current frame outside of rendered frames range"
          },

          preview_area_no_track_selected: {
            description:
              "No track selected. Select a track on the timeline to preview it here"
          },
          your_input_video_was_changed: {
            description: "Your input video was changed"
          },
          preview_area_nothing_to_show: {
            description:
              "Nothing to show here yet, run a render from a settings window"
          },
          preview_area_one_of_tracks_has_no_clips_available: {
            description: "One of the selected tracks has no clips available"
          },
          img2img_generation_failed: {
            description: "Generation failed, credits have been refunded"
          },
          api_key_error: {
            title: {
              label: "Application Error"
            },
            description: "Failed to initialize application. Please try again."
          },
          payment_flow_enough_coins: {
            description:
              "You need credits or a subscription to generate more videos",
            buy_credits: "Buy credits",
            try_relaxed: "See plans",
            enable_relaxed: "Enable Relaxed mode"
          },
          timeline_hide_from_timeline: {
            description:
              "The render is in progress. We can hide it from the timeline and delete it after the process is complete. However, the credits will not be refunded"
          },
          quick_tips_image_weight_prompt_impact: {
            description:
              'Prompt doesn\'t influence the result? With "Image weight" at 1, the prompt will have little impact. Lower the "Image weight" before increasing the "CFG".'
          },
          quick_tips_image_style_max_size_tile_control_net: {
            description:
              'Style from the image doesn\'t influence the result? Try increasing the "Output size" or decrease the Tile controlNet.'
          },
          quick_tips_refine_the_style_image_reference: {
            description:
              'How to refine the style image reference — You can style the first frame of your video and upload it as your "Image style reference" for better results.'
          },
          quick_tips_flickering_increase_max_size: {
            description: 'Too much flickering? Increase "Output size".'
          },
          quick_tips_flickering_increase_steps: {
            description: 'Too much flickering? Add more "Steps".'
          },
          quick_tips_flickering_increase_tile_control_net: {
            description:
              "Too much flickering? Increase the weight of the Tile ControlNet."
          },
          quick_tips_weird_elements_appearing_descriptive_prompt: {
            description:
              "Weird elements appearing? Add a more descriptive prompt."
          },
          quick_tips_weird_elements_appearing_increase_tile_control_net: {
            description:
              "Weird elements appearing? Increase the weight of Tile & Canny ControlNets."
          },
          quick_tips_weird_elements_appearing_increase_max_size: {
            description: 'Weird elements appearing? Increase "Output size".'
          },
          render_finished_title: {
            description: "New render finished 🟢"
          },
          render_finished_body: {
            description:
              "A new render just finished, check the queue to see the results."
          },
          render_finished_tab: {
            description: "🟢 New render finished | Mago.studio"
          },
          render_failed_title: {
            description: "New render failed 🔴"
          },
          render_failed_body: {
            description:
              "A new render just failed, check the queue to see the results."
          },
          render_failed_tab: {
            description: "🔴 New render failed | Mago.studio"
          },
          video_too_short: {
            description:
              "Video is too short. Please upload a video that is at least 1 second long."
          },
          video_too_short_for_model: {
            description:
              "Your video is shorter than the minimum duration required for this model ({{minFrames}} frames). Please select an other model or upload a longer video."
          },
          not_render_track: {
            description:
              "Video track selected. To see render information, select the render track by clicking on it."
          },
          not_a_video_file: {
            description:
              "This is not a valid video file. Please upload an MP4 or MOV file."
          },
          undefined_duration: {
            description:
              "Video duration is undefined or invalid. This may indicate a corrupted file or missing metadata. Please try converting the video to a standard MP4 format."
          },
          container_format_mismatch: {
            description:
              "Container format mismatch detected. The file appears to be a different format than its extension suggests. Please ensure the file is properly encoded as MP4 or MOV."
          },
          sbs_video_download_started: {
            description: "Preparing side-by-side video for download..."
          },
          sbs_video_download_success: {
            description: "Side-by-side video downloaded successfully"
          },
          sbs_video_download_failed: {
            description:
              "Failed to generate side-by-side video. Please try again."
          },
          sbs_video_videos_not_loaded: {
            description: "Unable to load videos. Please try again."
          },
          info_rich_video_download_started: {
            description: "Preparing video with info... this may take a moment."
          },
          info_rich_video_download_succeeded: {
            description: "Video with info downloaded successfully."
          },
          info_rich_video_download_failed: {
            description: "Failed to generate info-rich video. Please try again."
          },
          timeline_pinned_download_started: {
            description: "Preparing pinned clips for download..."
          },
          timeline_pinned_download_succeeded: {
            description: "Pinned clips downloaded successfully."
          },
          timeline_pinned_download_failed: {
            description: "Failed to download pinned clips. Please try again."
          },
          timeline_pinned_download_empty: {
            description: "No pinned clips to download."
          },
          timeline_download_navigation_warning: {
            description:
              "A download is still in progress. If you leave now it will be cancelled. Leave anyway?"
          },
          download_failed: {
            description: "Download failed. Please try again."
          },
          share_project: {
            description: "You are about to share this project with your team"
          },
          no_stats_available: {
            description: "No stats available"
          },
          aspect_ratio_mismatch_warning: {
            description:
              'Video output ratio will be the same as the Character input. We recommend using "Modify frame" to maintain same ratio'
          },
          bulk_upload_complete: {
            description:
              "All uploads complete — {{successCount}} of {{totalCount}} succeeded"
          },
          bulk_upload_complete_with_errors: {
            description:
              "Upload finished with errors — {{successCount}} of {{totalCount}} succeeded"
          }
        },
        bulk_upload: {
          uploading: {
            label: "Uploading {{current}} of {{total}}"
          },
          uploading_title: {
            label: "Uploading {{total}} items"
          },
          done_count: {
            label: "Done: {{completed}} out of {{total}} videos"
          },
          complete: { label: "Upload complete" },
          see_progress: { label: "See progress" },
          hide_progress: { label: "Hide progress" },
          cancel_all: { label: "Cancel all" },
          cancel: { label: "Cancel" },
          cancelled: { label: "Cancelled" },
          open_project: { label: "Open project" },
          video_too_long: {
            label: "Our current limit for video is 60 seconds"
          },
          file_too_large: {
            label: "The file size is more than 1 GB"
          },
          unsupported_format: {
            label:
              "We don't support this file format yet. You can use MP4 or MOV"
          },
          video_too_short: {
            label: "Videos under one second aren't supported"
          },
          video_broken: {
            label: "The video file is broken"
          },
          server_error: {
            label:
              "The video file uploading has failed on our side, please try again"
          },
          start_upload: { label: "Start upload" },
          upload_blocked: {
            label: "Upload already in progress"
          },
          hide: { label: "Hide" },
          error: { label: "Error" },
          pending: { label: "Pending" },
          completed: { label: "Completed" },
          not_started: { label: "Not started" },
          done: { label: "Done" },
          uploading_status: { label: "Uploading" },
          cancel_all_files: { label: "Cancel uploading all files" },
          done_count_with_errors: {
            label:
              "Uploaded: {{completed}} out of {{total}} videos, errors: {{errors}}"
          }
        },
        script_project: {
          text_access_title: {
            label: "Choose how to run your script"
          },
          text_access_sign_in_description: {
            label:
              "Chat and casting need Mago cloud or a working local Qwen3.8 27B setup. No usable local setup was found. Sign in to use Mago cloud, or set up locally on a compatible computer."
          },
          text_access_enable_description: {
            label:
              "Mago cloud is disabled and no usable local Qwen3.8 27B setup was found. Enable Mago cloud for chat and casting, or set up locally on a compatible computer."
          },
          text_access_cancel: { label: "Cancel" },
          text_access_sign_in: { label: "Sign in to Mago cloud" },
          text_access_enable_cloud: { label: "Enable Mago cloud" },
          text_access_local_setup: { label: "Local setup wizard" },
          text_access_cloud_failed: {
            label: "Unable to enable Mago cloud. Please try again."
          },
          version_settings_missing: {
            description: "No reusable settings were recorded for this version."
          },
          version_rendered_at: { label: "Rendered {{timestamp}}" },
          version_new_badge: { label: "New" },
          rate_version_down_button: { label: "Dislike this version" },
          rate_version_up_button: { label: "Like this version" },
          asset_references: {
            label: "Reference images",
            hint: "Add up to {{count}} images and describe what to take from each.",
            add: "Add reference",
            instruction: "Reference instructions",
            default_instruction:
              "Use these images as visual references for this entity.",
            remove: "Remove reference"
          },
          render_blocked_run_active: {
            label: "Wait for the current run to finish."
          },
          render_blocked_reference_uploading: {
            label: "Uploading reference image…"
          },
          shot_dialogue_input: {
            label: "Dialogue",
            placeholder: "SPEAKER: Spoken line"
          },
          create_dialog_title: {
            label: "What type of project do you want to create?"
          },
          create_destination: { label: "Create project in" },
          create_destination_local: {
            label: "Local library",
            description: "Stored on this computer and rendered with ComfyUI."
          },
          create_destination_cloud: {
            label: "Mago Cloud",
            description:
              "Stored in your Mago account and rendered with cloud models."
          },
          create_destination_dialog_title: {
            label: "New {{projectType}} project"
          },
          create_local_project_button: { label: "Create local project" },
          create_cloud_project_button: { label: "Create cloud project" },
          create_destination_cloud_sign_in_tooltip: {
            label: "Sign in to Mago cloud to create cloud projects."
          },
          start_from_scenario: {
            label: "Mago Director",
            description:
              "Tell the Agent your idea and chat it into a scene-by-scene script, then cast it, generate assets per character, environment, props, etc.. and render the whole drama. Verification, edit and iteration steps available for more control."
          },
          start_from_video: {
            label: "Transform your own videos",
            description:
              "Start from existing footage and restyle it, add vfx, etc… shot by shot or in bulk."
          },
          tab_script: { label: "Script" },
          tab_assets: { label: "Assets" },
          tab_storyboard: { label: "Storyboard" },
          tab_shots: { label: "Scenes" },
          tab_post: { label: "Post" },
          tab_timeline: { label: "Timeline" },
          stats_title: { label: "Project stats" },
          stats_button: { ariaLabel: "Show project stats" },
          stats_assets: { label: "Assets" },
          stats_asset_images: { label: "Asset images" },
          stats_sequences: { label: "Sequences" },
          stats_shots: { label: "Scenes" },
          stats_rendered_videos: { label: "Rendered videos" },
          stats_image_cost: {
            label: "Image cost",
            value: "≈{{credits}} cr."
          },
          stats_video_cost: {
            label: "Video cost",
            value: "≈{{credits}} cr."
          },
          stats_total_cost: {
            label: "Total cost",
            value: "{{credits}} cr."
          },
          timeline_ready_count: {
            label: "{{count}} of {{total}} scenes rendered"
          },
          download_cut_button: {
            label: "Download all"
          },
          download_shot_button: {
            label: "Download this scene"
          },
          shot_filmstrip: {
            alt: "Scene preview"
          },
          download_cut_failed: {
            label: "Could not download the cut. Try again."
          },
          export_refused_mixed_profile: {
            label: "Not every scene is the same size (scenes: {{shots}})."
          },
          export_refused_missing_pin: {
            label: "Nothing is pinned for scenes: {{shots}}."
          },
          export_refused_unknown_profile: {
            label: "No size recorded for scenes: {{shots}}."
          },
          export_refused_unknown_reason: {
            label: "This cut cannot be joined into one file."
          },
          export_unavailable: {
            label: "Joining the cut into one file is unavailable."
          },
          export_timed_out: {
            label: "Joining the cut took too long and was given up on."
          },
          export_failed_reason: {
            label: "Something went wrong while joining the cut."
          },
          export_failed_title: {
            label: "Could not download the cut as one video"
          },
          export_failed_offer_zip: {
            label:
              "You can download the scenes as separate files instead, in a zip."
          },
          export_failed_cancel_button: {
            label: "Cancel"
          },
          export_failed_download_zip_button: {
            label: "Download separate files"
          },
          export_will_be_separate_files: {
            label: "This cut cannot be joined into one video yet"
          },
          download_shots_button: {
            label: "Download scenes"
          },
          download_shot_failed: {
            label: "Could not download that scene. Try again."
          },
          run_paused_insufficient_credits: {
            description: "You don't have enough credits to finish this run."
          },
          run_failed: {
            description:
              "That run did not finish. Nothing was changed — try again."
          },
          run_progress_unavailable: {
            description:
              "Lost track of that run. It may still be going — reload to see where it got to."
          },
          cast_script_failed: {
            description: "Could not read that script. Try again."
          },
          generate_shots_failed: {
            description: "Could not start the scene renders. Try again."
          },
          shot_run_refused_in_progress: {
            description:
              "Already rendering in the current run — it appears here when it lands."
          },
          shot_run_refused_unchanged: {
            description:
              "Nothing to render: those exact inputs already rendered."
          },
          shot_run_refused_blocked: {
            description: "Blocked — a reference image is missing."
          },
          shot_run_refused_dropped: {
            description:
              "The latest cast of your script dropped this scene, so it does not render."
          },
          shot_run_refused_unknown: {
            description:
              "Nothing was started. Reload to see where this project got to."
          },
          generate_sheets_failed: {
            description: "Could not start the entity renders. Try again."
          },
          upscale_shots_failed: {
            description: "Could not start the upscale. Try again."
          },
          edit_shot_failed: {
            description: "Could not save that scene. Try again."
          },
          add_shot_failed: {
            description: "Could not add that scene. Try again."
          },
          shot_insert_button: {
            ariaLabel: "Add a scene here",
            tooltip: "Add a scene here"
          },
          add_shot_dialog_title: {
            label: "Add scene"
          },
          add_shot_name_input: {
            label: "Scene name",
            placeholder: "New scene"
          },
          add_shot_assets_input: {
            label: "Assets"
          },
          add_shot_hint: {
            label: "Set the duration on the scene card."
          },
          add_shot_submit_button: {
            label: "Add"
          },
          hide_shot_button: {
            ariaLabel: "Hide scene"
          },
          show_shot_button: {
            ariaLabel: "Show scene"
          },
          shot_drag_handle: {
            ariaLabel: "Drag to move this scene"
          },
          shot_run_refused_unsaved_prompt: {
            description:
              "Nothing was rendered. Save your prompt, then try again."
          },
          pin_shot_failed: {
            description: "Could not pin that version. Try again."
          },
          edit_entity_failed: {
            description: "Could not save that entity. Try again."
          },
          pin_entity_image_failed: {
            description: "Could not pin that image. Try again."
          },
          render_entity_failed: {
            description: "Could not start that entity render. Try again."
          },
          upload_reference_failed: {
            description: "Could not upload that reference. Try again."
          },
          upload_entity_image_failed: {
            description: "Could not upload that image. Try again."
          },
          script_input: {
            label: "Your script",
            placeholder: "Paste your script here."
          },
          generate_from_script_button: { label: "Run production pipeline" },
          planned_length: { label: "Planned {{planned}}s" },
          planned_length_with_target: {
            label: "Planned {{planned}}s · target {{target}}s"
          },
          script_agent_intro: {
            label:
              "Tell the Agent your idea. Your script appears here, written for the AI video generation workflow."
          },
          script_ideas_title: {
            label: "Not sure where to start? Try one of these:"
          },
          own_script_button: { label: "I have my script" },
          script_idea_blood_cells: {
            label:
              "I want a 12-part series where a curious red blood cell visits a different organ in each episode."
          },
          script_idea_everyday_object: {
            label:
              "I want a 15-part series where one everyday object tells the story of how it was invented."
          },
          script_idea_tiny_astronaut: {
            label:
              "I want a 20-part series about a tiny astronaut who finds one strange thing on each planet."
          },
          chat: {
            input_placeholder: { label: "Describe your idea" },
            send: { label: "Send" },
            thinking: { label: "Thinking…" },
            script_updated: {
              label: "Script updated. Continue chatting to update your script."
            },
            empty_response: {
              label: "Nothing came back. Try sending that again."
            },
            insufficient_balance: {
              label: "You are out of credits. Top up to keep writing."
            },
            failed: {
              description: "The Agent could not answer. Try sending that again."
            }
          },
          script_locked: {
            ariaLabel: "This script has been sent and can no longer be edited"
          },
          versions_title: {
            label: "Versions"
          },
          shot_version_current: {
            label: "Current"
          },
          use_shot_version_button: {
            label: "Use this version"
          },
          unpin_shot_version_button: {
            label: "Unpin"
          },
          lock_shot_button: { label: "Lock scene" },
          unlock_shot_button: { label: "Unlock scene" },
          shot_lock_status_locked: { label: "Locked" },
          shot_lock_status_unlocked: { label: "Unlocked" },
          sequence_timeline: { label: "Scene timeline" },
          sequence_timeline_score: { label: "{{score}}" },
          sequence_timeline_rendering: { label: "Rendering" },
          sequence_timeline_sequential: {
            label: "Continues from the previous sequence"
          },
          sequence_timeline_changed: { label: "Changed" },
          sequence_timeline_changed_help: {
            label: "Changed and eligible for bulk rerender"
          },
          version_review_good: {
            label: "What works",
            placeholder: "Good details to preserve"
          },
          version_review_bad: {
            label: "What does not work",
            placeholder: "Problems in this version"
          },
          version_review_todo: {
            label: "Next changes",
            placeholder: "What to try next"
          },
          version_name: {
            label: "v{{version}}"
          },
          version_number: {
            label: "Version {{number}}"
          },
          version_active: {
            label: "Active"
          },
          version_status: {
            label: "Casting…"
          },
          version_failed: {
            label: "Casting failed"
          },
          activate_version_button: {
            label: "Make v{{version}} active"
          },
          summary_shots_kept: {
            label: "{{count}} scenes carry over"
          },
          summary_shots_added: {
            label: "{{count}} new"
          },
          summary_shots_dropped: {
            label:
              "{{count}} no longer in the script — their renders stay, read-only"
          },
          summary_keys_added: {
            label: "{{count}} new cast entities"
          },
          summary_keys_unused: {
            label: "{{count}} entities disabled, images kept"
          },
          no_versions: {
            label: "No script cast yet. Paste a script and cast it to begin."
          },
          section_character: { label: "Characters" },
          section_environment: { label: "Environments" },
          section_prop: { label: "Props" },
          section_uncategorised: { label: "Other" },
          generate_sheets_button: {
            label: "Generate",
            count: "({{count}})"
          },
          price_calculating: { label: "Calculating the price" },
          generate_shots_button: {
            label: "Generate",
            count: "({{count}})"
          },
          generate_storyboards_button: {
            label: "Generate",
            count: "({{count}})"
          },
          toolbar_nothing_to_generate: {
            noChanges: "No changes since the last generation",
            noSceneAwaitingStoryboard: "No scene is waiting for a storyboard"
          },
          upscale_button: {
            label: "Upscale",
            count: "{{count}} pinned",
            nothing: "nothing to upscale"
          },
          pin_button: {
            label: "Pin",
            ariaLabel: "Pin this version"
          },
          pinned_badge: {
            label: "Pinned"
          },
          stats_cloud_cost: { label: "Mago Cloud cost" },
          stats_local_render_time: { label: "Local render time" },
          stats_h3_max_equivalent: {
            label: "Mago Cloud H3 Max equivalent"
          },
          effective_badge: {
            label: "Will be used"
          },
          newer_version_badge: {
            label: "Newer version available"
          },
          use_newest_button: {
            label: "Use this everywhere"
          },
          disable_entity_button: {
            label: "Remove from cast"
          },
          enable_entity_button: {
            label: "Add back to cast"
          },
          disabled_entity_badge: {
            label: "Disabled"
          },
          show_earlier_version_items: {
            label: "Show {{count}} from an earlier script version"
          },
          section_removed_from_cast: {
            label: "Removed from cast"
          },
          confirm_remove_entity_title: {
            label: "Remove {{name}} from the cast?"
          },
          confirm_remove_entity_body: {
            label:
              'Its images are kept and it stays in {{count}} scene(s) until you retag them. Tick "Show from an earlier script version" to add it back.'
          },
          confirm_remove_entity_cancel_button: { label: "Keep in cast" },
          confirm_remove_entity_confirm_button: { label: "Remove from cast" },
          rerender_button: {
            label: "Re-render",
            ariaLabel: "Render another version"
          },
          render_button: {
            label: "Render",
            ariaLabel: "Render this slot"
          },
          describe_entity_button: {
            label: "Describe from image"
          },
          describe_entity_failed: {
            description: "Could not write a description for this entity."
          },
          entity_prompt_input: {
            label: "Render prompt"
          },
          prompt_is_sent_hint: {
            label:
              "What the image model receives when rendering this reference."
          },
          no_images: {
            label: "No image yet"
          },
          shot_prompt_input: {
            label: "Video prompt"
          },
          shot_blocked: {
            label: "Blocked — {{entities}}"
          },
          shot_blocked_disabled: {
            label: "{{name}} is disabled"
          },
          shot_blocked_no_image: {
            label: "{{name}} has no pinned image"
          },
          shot_blocked_unavailable: {
            label: "{{name}} is unavailable"
          },
          shot_blocked_no_reference_image: {
            label: "Blocked — add a reference image to generate this scene."
          },
          cut_title: {
            label: "Cut — pinned upscale, else pinned render"
          },
          cut_missing: {
            label: "{{count}} scenes have nothing to contribute yet"
          },
          shot_versions_title: {
            label: "{{shot}} · versions"
          },
          version_not_ready: {
            label: "Rendering…"
          },
          generate_scene_no_changes_note: {
            label: "No changes since the last generation"
          },
          shot_lock_button: {
            ariaLabel: "Lock this scene",
            lockTooltip: "Approve and lock this scene",
            unlockTooltip: "Locked · unlock to edit"
          },
          show_all_shot_versions_link: {
            label: "Show all versions ({{count}})"
          },
          version_more_menu_button: { label: "More version actions" },
          play_shot_button: {
            label: "Play this scene"
          },
          pause_shot_button: {
            label: "Pause this scene"
          },
          play_cut_button: {
            label: "Play the cut"
          },
          pause_cut_button: {
            label: "Pause the cut"
          },
          compare_versions_timeline: {
            label: "Version comparison timeline"
          },
          play_all_versions_button: {
            label: "Play all versions"
          },
          pause_all_versions_button: {
            label: "Pause all versions"
          },
          upscale_badge: {
            label: "Upscale"
          },
          dry_run_blocked: {
            label: "{{count}} blocked"
          },
          dry_run_skipped: {
            label: "{{count}} unchanged"
          },
          dry_run_pinned_upload: {
            label: "{{count}} pinned upload — not regenerated"
          },
          dry_run_render_in_progress: {
            label: "{{count}} rendering…"
          },
          empty_state: {
            label: "Cast a script first — the Script tab is where this starts."
          },
          assets_empty_state: {
            label:
              "No assets have been created yet, send the script to the first tab."
          },
          no_search_results: {
            label: "Nothing matches “{{query}}”."
          },
          run_in_progress: {
            label: "Working — this opens the next tab when it finishes."
          },
          run_step_count: {
            label: "{{completed}} of {{total}} steps"
          },
          unpin_button: {
            label: "Pinned"
          },
          drop_image_hint: {
            label: "Drop or click"
          },
          upload_reference_dialog_title: {
            label: "Upload a reference for this scene"
          },
          upload_reference_dialog_body: {
            label:
              "The image becomes a cast entity, so other scenes can use it too and it keeps its own versions."
          },
          choose_image_button: {
            label: "Choose image"
          },
          no_file_chosen: {
            label: "No image chosen"
          },
          upload_reference_submit_button: {
            label: "Upload and tag"
          },
          aspect_ratio_input: {
            label: "Aspect ratio"
          },
          resolution_input: {
            label: "Resolution"
          },
          sheet_resolution_input: {
            label: "Image resolution"
          },
          sheet_resolution_1m: {
            label: "1 MP"
          },
          sheet_resolution_2m: {
            label: "2 MP"
          },
          will_rerender_because: {
            label: "Will re-render — you changed: {{fields}}"
          },
          changed_prompt: { label: "the prompt" },
          changed_dialogue: { label: "the dialogue" },
          changed_description: { label: "the description" },
          changed_model: { label: "the model" },
          changed_output_size: { label: "the size" },
          changed_duration: { label: "the scene length" },
          changed_retries: { label: "the retry count" },
          changed_render_speed: { label: "the render speed" },
          changed_visual_style: { label: "the visual style" },
          changed_characters: { label: "a character image" },
          changed_environments: { label: "an environment image" },
          changed_props: { label: "a prop image" },
          changed_references: { label: "the reference images" },
          metrics_score: { label: "{{score}}/{{max}}" },
          metrics_axis_score: { label: "{{score}}/{{max}}" },
          metrics_pending: { label: "Scoring…" },
          metrics_passed: { label: "Passed the quality check" },
          metrics_failed: { label: "Failed the quality check" },
          metrics_next_prompt: { label: "Suggested: {{suggestion}}" },
          metrics_not_scored: { label: "Not scored" },
          metrics_error_reason: {
            label: "The quality check could not run ({{stage}}): {{message}}"
          },
          metric_style: { label: "Style" },
          metric_content: { label: "Content" },
          metric_identity: { label: "Identity" },
          metric_lighting: { label: "Lighting" },
          metric_quality: { label: "Quality" },
          metric_temporal_style: { label: "Style over time" },
          metric_temporal_identity: { label: "Identity over time" },
          metric_prompt_adherence: { label: "Follows the prompt" },
          metric_coherence: { label: "Holds together" },
          metric_usability: { label: "Usable as a reference" },
          score_assets_toggle: { label: "Score each image" },
          score_assets_hint: {
            label: "One extra AI check per image. Not billed to you."
          },
          shot_retries_input: {
            label: "Retries"
          },
          retries_cost_hint: {
            label: "up to {{attempts}} attempts each, billed per attempt"
          },
          sheet_render_model_input: {
            label: "Reference image model"
          },
          storyboard_render_model_input: {
            label: "Storyboard image model"
          },
          visual_style_input: {
            label: "Visual style",
            placeholder:
              "e.g. Muted cobalt palette, copper halftones, soft film grain",
            hint: "Applied to every asset image and scene video. Leave empty for no style.",
            save_error: "Could not save the visual style."
          },
          sheet_render_model_seedream_5_pro_t2i: {
            label: "Seedream 5 Pro"
          },
          sheet_render_model_gpt_image_2_t2i: {
            label: "GPT Image 2"
          },
          sheet_render_model_nanobanana_2_t2i: {
            label: "Nano Banana 2"
          },
          sheet_render_model_qwen_image_2512_local: {
            label: "Qwen Image 2512 (Local)"
          },
          sheet_render_model_flux2_klein_4b_q8_local: {
            label: "Flux 2 Klein 4B Q8 (Local)"
          },
          sheet_render_model_flux2_klein_9b_q8_local: {
            label: "Flux 2 Klein 9B Q8 (Local)"
          },
          local_h3_steps_input: {
            label: "MiniMax H3 speed"
          },
          local_h3_steps_2: { label: "2 step draft" },
          local_h3_steps_4: { label: "4 step turbo" },
          local_h3_steps_8: { label: "8 step HD" },
          local_h3_steps_not_installed: { label: "Not installed" },
          local_h3_legacy_workflow_toggle: {
            label: "Legacy KSampler"
          },
          local_h3_text_encoder_input: {
            label: "Local H3 text encoder"
          },
          local_h3_text_encoder_heretic: {
            label: "Qwen3-VL Heretic"
          },
          local_h3_text_encoder_vanilla: {
            label: "Qwen3-VL Vanilla"
          },
          local_h3_model_input: {
            label: "Local H3 model"
          },
          local_h3_model_base: {
            label: "MiniMax H3 Base INT8"
          },
          local_h3_model_singularity: {
            label: "MiniMax H3 Singularity v1.3 INT8"
          },
          shot_render_speed_input: {
            label: "Render speed"
          },
          shot_render_speed_slow: {
            label: "Slow rendering"
          },
          shot_render_speed_fast: {
            label: "Fast rendering"
          },
          shot_render_seedance_2_5: {
            label: "Seedance 2.5"
          },
          sequential_chain_start: {
            label: "Starts a chain — renders in parallel"
          },
          shot_chain_button: {
            ariaLabel: "Continuation settings",
            unchainedTooltip:
              "Not linked. This scene renders on its own, in parallel with the others.\nClick to set it to continue from the previous scene.",
            chainedTooltip:
              "Linked. This scene continues from the previous scene's pinned version and renders after it.\nClick to change or turn off the continuation."
          },
          shot_sequential_settings_dialog_title: {
            label: "Continue from previous scene"
          },
          image_description_title: {
            label: "Description"
          },
          image_description_absent: {
            label: "Not described yet"
          },
          image_description_cleared: {
            label: "No description"
          },
          image_description_inherited: {
            label:
              "From the cast slot. Describe or edit to make it this version's own."
          },
          edit_description_failed: {
            description: "Could not save this description."
          },
          edit_description_button: {
            label: "Edit"
          },
          save_button: {
            label: "Save"
          },
          cancel_button: {
            label: "Cancel"
          },
          sequential_source_shot: {
            label: "Continues from {{shot}}"
          },
          sequential_mode_input: {
            label: "What to continue from"
          },
          sequential_mode_off: {
            label: "Off"
          },
          sequential_mode_last_frame: {
            label: "Last frame"
          },
          sequential_mode_key_frames: {
            label: "Key frames"
          },
          sequential_key_frame_count: {
            label: "Frames to pick (1–4)"
          },
          sequential_prompt_appendix_input: {
            label: "Sequential prompt",
            placeholder: "Continue the motion; do not repeat the action."
          },
          sequential_prompt_default_hint: {
            label: "Default for this continuation. Edit it to write your own."
          },
          sequential_prompt_reset_button: {
            label: "Reset to default"
          },
          sequential_opening_frame_input: {
            label: "How it continues"
          },
          sequential_opening_frame_cut: {
            label: "Cut to a new angle on the same moment"
          },
          sequential_opening_frame_pin: {
            label: "Open on the previous frame (experimental)"
          },
          sequential_opening_frame_off: {
            label: "Loose reference only"
          },
          sequential_pin_hint: {
            label:
              "Continues from the previous scene's pinned version. Pinning a different one makes this scene stale."
          },
          suspend_sequential_for_run: {
            label: "Ignore sequential for this run ({{count}})"
          },
          shot_blocked_sequential_unsupported_engine: {
            label:
              "Blocked — this engine cannot use a cross-scene reference yet. Only MiniMax can."
          },
          shot_sequential_reference_ignored: {
            label:
              "Renders without a reference — nothing before it to continue from."
          },
          shot_blocked_sequential_no_predecessor_render: {
            label:
              "Blocked — the previous scene has no finished render. Render it first, or pin one of its versions."
          },
          shot_blocked_sequential_unsupported_mode: {
            label:
              "Blocked — this continuation isn't supported. Pick Last frame or Key frames."
          },
          shot_blocked_sequential_unsupported_opening_frame: {
            label:
              "Blocked — this engine can't open on the previous frame yet. Pick Cut to a new angle."
          },
          shot_duration_out_of_bounds: {
            label:
              "Scenes render {{minSeconds}}–{{maxSeconds}} s. This scene is {{seconds}} s."
          },
          shot_duration_hint: {
            label: "{{seconds}}s"
          },
          atomic_shots_toggle: {
            label: "Let AI decide scenes amount and length based on script"
          },
          sequential_shots_casting_toggle: {
            label: "Use sequential scenes when continuity needs them"
          },
          character_design_versions_toggle: {
            label: "Create character and asset design versions"
          },
          separate_style_toggle: {
            label: "Create a separate visual style prompt"
          },
          separate_camera_toggle: {
            label: "Create separate camera prompts"
          },
          visual_style_prompt: {
            label: "Visual style prompt",
            placeholder: "Describe the shared visual language for this project."
          },
          edit_visual_style_failed: {
            description: "Could not save the visual style prompt."
          },
          no_design_versions_found: {
            label:
              "Design versions were enabled, but the script did not contain any distinct character, environment, or prop designs."
          },
          camera_prompt: {
            label: "Camera prompt"
          },
          camera_prompt_edit_button: {
            label: "Edit camera prompt"
          },
          camera_framing: {
            label: "Framing"
          },
          camera_movement: {
            label: "Movement"
          },
          camera_lens: {
            label: "Lens"
          },
          render_defaults_hint: {
            label:
              "{{width}}×{{height}}, {{seconds}}s ({{frames}} frames) for every scene in this project"
          },
          production_total_hint: {
            label:
              "about {{credits}} credits to generate everything — {{entityCount}} references and {{shotCount}} scenes"
          },
          cut_load_failed: {
            label: "Could not load the cut. Reload, or check the console."
          },
          loading: {
            label: "Loading…"
          },
          no_shot_renders_yet: {
            label: "None of the {{count}} scenes reports a finished render."
          },
          no_shot_renders_hint: {
            label:
              "If renders have completed, they have not reached the cut — check the render queue."
          },
          no_shots_in_cut: {
            label: "This project has no scenes yet — cast a script first."
          },
          no_render_yet: {
            label: "No render yet"
          },
          shot_render_failed: {
            label: "This scene's render failed."
          },
          shot_storyboard_failed: {
            label: "This scene's storyboard failed."
          },
          video_without_failed_storyboard: {
            label:
              "This scene's storyboard failed. The video renders without it."
          },
          video_without_stale_storyboard: {
            label:
              "This scene's storyboard is out of date. The video renders without it until you generate a new one."
          },
          storyboard_stale: {
            label:
              "The shots changed since this storyboard was drawn. Video renders skip it until you generate a new one."
          },
          storyboard_last_attempt_failed: {
            label:
              "The last storyboard attempt failed. The previous version is still used."
          },
          storyboard_too_many_shots: {
            label: "A storyboard can draw at most {{count}} shots."
          },
          storyboard_versions_link: {
            label: "Versions ({{count}})"
          },
          storyboard_versions_title: {
            label: "{{scene}} · storyboard versions"
          },
          storyboard_version_failed: {
            label: "This version failed"
          },
          storyboard_used_in_video_switch: {
            label: "Use in video"
          },
          update_storyboard_failed: {
            description: "Could not update the storyboard. Try again."
          },
          sent_prompt_field: {
            label: "Prompt sent to the video model"
          },
          generate_scene_button: {
            label: "Generate ({{seconds}} sec)"
          },
          scene_references_heading: {
            label: "References"
          },
          generate_storyboard_button: {
            label: "Generate storyboard"
          },
          generate_storyboard_failed: {
            description: "The storyboard could not be generated."
          },
          storyboard_sheet_setup_failed: {
            description:
              "The storyboard is rendering, but its references could not be updated. Try again."
          },
          no_storyboard_yet: {
            label: "No storyboard yet"
          },
          storyboard_version_badge: {
            label: "Storyboard"
          },
          remove_storyboard_button: {
            ariaLabel: "Remove storyboard from scene"
          },
          scene_shot_table: {
            column_duration: { label: "Duration (s)" },
            column_camera: { label: "Camera movement" },
            column_framing: { label: "Framing" },
            column_description: { label: "Description" },
            shot_number: { label: "Shot {{number}}" },
            camera_placeholder: { label: "Static" },
            framing_placeholder: { label: "Medium close-up" },
            add_shot: { label: "Add shot" },
            delete_shot: { ariaLabel: "Delete shot {{number}}" }
          },
          scenes_interface: {
            layout_cards: { label: "Cards" },
            layout_list: { label: "List" }
          },
          confirm_pin_title: {
            label: "This changes scenes downstream"
          },
          confirm_pin_body: {
            label:
              "{{count}} scenes use {{name}}. Changing its pinned image marks them changed, so the next Generate re-renders them."
          },
          confirm_pin_cancel_button: {
            label: "Cancel"
          },
          confirm_pin_confirm_button: {
            label: "Change the pin"
          },
          uploaded_badge: {
            label: "Uploaded"
          },
          pinned_upload_hint: {
            label: "Your image is pinned — bulk runs skip this entity."
          },
          add_entity_button: {
            label: "Add entity"
          },
          add_entity_name_input: {
            label: "Name"
          },
          add_entity_kind_input: {
            label: "Category"
          },
          new_entity_default_name: {
            character: "New Character",
            environment: "New Environment",
            prop: "New Prop"
          },
          add_entity_token_taken: {
            label: "The cast already has an entity with this name."
          },
          draft_entity_hint: {
            label:
              "Render it, or drop in an image, to save it. Until then it is not saved."
          },
          discard_draft_entity_button: {
            ariaLabel: "Discard new entity"
          },
          add_reference_button: {
            label: "Add reference"
          },
          remove_reference_button: {
            ariaLabel: "Remove {{name}} from this scene"
          },
          zoom_reference_button: {
            ariaLabel: "Open {{name}} full size"
          },
          download_version_button: {
            ariaLabel: "Download this version"
          },
          reuse_settings_button: {
            label: "Reuse settings",
            ariaLabel: "Load this version's settings into the prompt"
          },
          image_inputs_title: {
            label: "What went into {{version}}"
          },
          image_inputs_loading: {
            label: "Loading inputs…"
          },
          image_inputs_model: {
            label: "Model · {{model}}"
          },
          image_inputs_size: {
            label: "Size · {{width}}×{{height}}"
          },
          image_inputs_missing: {
            label: "This version recorded no prompt."
          },
          cut_membership_count: {
            label: "{{count}} of {{total}} in the cut"
          },
          section_group_count: {
            label: "{{count}}"
          }
        },
        bulk_rendering: {
          apply_settings_button: {
            label: "Apply settings to multiple shots"
          },
          info_button: {
            ariaLabel: "What is Bulk rendering"
          },
          popover_title: {
            label: "What is Bulk rendering"
          },
          video_caption: {
            label: "Video about feature"
          },
          hide_button: {
            label: "Hide"
          },
          shot_selection_title: {
            label: "Select shots to apply settings"
          },
          shot_selection_close_button: {
            ariaLabel: "Close"
          },
          shot_selection_cancel_button: {
            label: "Cancel"
          },
          shot_selection_next_button: {
            label: "Next"
          },
          shot_selection_select_all: {
            label: "Select all"
          },
          first_frame_source_choice_title: {
            label:
              "Do you have your own edited frames ready to use \nor do you want to create them from your Shot_01 settings? "
          },
          first_frame_source_choice_generate_button: {
            label: "No, show me generation step"
          },
          first_frame_source_choice_upload_button: {
            label: "Yes, I have"
          },
          first_frame_bulk_drop_zone_title: {
            label: "Bulk upload"
          },
          first_frame_bulk_drop_zone_hint: {
            label:
              "Upload all first frames at once and we auto-link them by filename"
          },
          first_frame_upload_modal_title: {
            label: "Uploading {{count}} item",
            label_other: "Uploading {{count}} items"
          },
          first_frame_upload_modal_description: {
            label:
              "Uploaded: {{uploadedCount}} out of {{count}} image, errors: {{errorCount}}",
            label_other:
              "Uploaded: {{uploadedCount}} out of {{count}} images, errors: {{errorCount}}"
          },
          first_frame_upload_modal_cancel_all_button: {
            label: "Cancel uploading all files"
          },
          first_frame_upload_modal_close_button: {
            label: "Close"
          },
          first_frame_upload_row_linked_status: {
            label: "Linked to {{shotName}}"
          },
          first_frame_upload_row_unlinked_status: {
            label:
              "This image hasn't been linked to any Shot and will be skipped during generation"
          },
          first_frame_upload_row_upload_failed_status: {
            label: "Uploading error"
          },
          first_frame_upload_row_not_started_status: {
            label: "Not started"
          },
          first_frame_upload_row_dismiss_button: {
            ariaLabel: "Dismiss"
          },
          first_frame_upload_row_cancel_button: {
            ariaLabel: "Cancel upload"
          },
          shot_selection_name_input: {
            label: "Run name"
          },
          run_view_close_button: {
            ariaLabel: "Close"
          },
          run_view_image_step_tab: {
            label: "Image step"
          },
          run_view_video_step_tab: {
            label: "Video step"
          },
          draft_close_button: {
            ariaLabel: "Close"
          },
          draft_image_step_tab: {
            label: "Image step"
          },
          draft_video_step_tab: {
            label: "Video step"
          },
          draft_untitled_run: {
            label: "Bulk render"
          },
          draft_image_step_back_button: {
            label: "Back"
          },
          draft_image_step_check_video_settings_button: {
            label: "Check video settings"
          },
          draft_video_step_back_button: {
            label: "Back"
          },
          draft_video_step_generate_button: {
            label: "Generate"
          },
          draft_first_frame_source_choice_back_button: {
            label: "Back"
          },
          draft_first_frame_source_choice_generate_button: {
            label: "Generate images"
          },
          draft_credits_mode_only_notice: {
            label:
              "Bulk rendering runs on credits only. Switch off unlimited mode to generate."
          },
          draft_shot_missing_uploaded_first_frame_error: {
            label: "This Shot has no uploaded first frame"
          },
          draft_shot_card_auto_linking_failed_badge: {
            label: "Auto-linking failed"
          },
          draft_shot_card_frame_chip: {
            label: "Frame 0"
          },
          draft_shot_card_frame_label: {
            label: "Frame"
          },
          draft_shot_card_original_chip: {
            label: "Original"
          },
          draft_shot_card_frame_info: {
            ariaLabel: "About this frame"
          },
          draft_shot_card_prompt_label: {
            label: "Prompt"
          },
          draft_shot_card_prompt_field: {
            ariaLabel: "Prompt for {{shotName}}"
          },
          draft_shot_card_optimize_button: {
            label: "Optimize"
          },
          draft_shot_card_model_label: {
            label: "Model"
          },
          draft_shot_card_image_reference_label: {
            label: "Add Image reference"
          },
          draft_shot_card_regenerate_button: {
            label: "Regenerate"
          },
          draft_shot_card_settings_label: {
            label: "Settings"
          },
          draft_shot_card_settings_value: {
            label: "Master settings"
          },
          draft_shot_card_settings_value_unique: {
            label: "Unique settings"
          },
          draft_shot_card_settings_edit_button: {
            ariaLabel: "Edit settings"
          },
          draft_video_step_master_settings_label: {
            label: "Master settings"
          },
          draft_video_step_master_settings_show_button: {
            label: "Show"
          },
          draft_video_step_master_settings_hide_button: {
            label: "Hide"
          },
          shot_settings_panel_title: {
            label: "Set up unique settings for this video"
          },
          shot_settings_panel_dialog: {
            ariaLabel: "Settings for {{shotName}}"
          },
          shot_settings_panel_save_button: {
            label: "Save"
          },
          shot_settings_panel_cancel_button: {
            label: "Cancel"
          },
          draft_discard_warning_description: {
            label:
              "Going back loses the prompts you edited for this run. This can't be undone."
          },
          draft_discard_warning_cancel_button: {
            label: "Keep editing"
          },
          draft_discard_warning_confirm_button: {
            label: "Discard"
          },
          shot_phase_in_progress: {
            label: "In progress"
          },
          shot_phase_completed: {
            label: "Done"
          },
          run_view_error: {
            description: "Could not load this run."
          },
          run_view_untitled_run: {
            label: "Bulk render"
          },
          navbar_entry: {
            label: "Bulk rendering"
          },
          panel_title: {
            label: "Bulk rendering"
          },
          panel_close_button: {
            ariaLabel: "Close"
          },
          panel_section_in_progress: {
            label: "In progress"
          },
          panel_section_history: {
            label: "History"
          },
          panel_empty_in_progress: {
            label: "No runs in progress"
          },
          panel_empty_history: {
            label: "No finished runs yet"
          },
          panel_row_step: {
            label: "Step {{stepNumber}}: {{stepName}}"
          },
          panel_row_images_stat: {
            label: "Images: {{completed}}/{{total}}"
          },
          panel_row_videos_stat: {
            label: "Videos: {{completed}}/{{total}}"
          },
          panel_row_duration: {
            label: "Duration: {{duration}}"
          },
          panel_row_errors_none: {
            label: "Errors: {{count}}"
          },
          panel_row_errors_present: {
            label: "Errors — Image: {{imageErrors}}, Video: {{videoErrors}}"
          },
          panel_row_current_step_image: {
            label: "Image"
          },
          panel_row_current_step_video: {
            label: "Video"
          },
          panel_row_queued_status: {
            label: "In queue"
          },
          panel_row_cancel_button: {
            label: "Cancel"
          },
          panel_row_continue_button: {
            label: "Continue"
          },
          panel_row_resume_insufficient_credits: {
            description: "You don't have enough credits to finish this run."
          },
          panel_row_status_error: {
            label: "Unknown Error"
          },
          panel_row_toggle_history_row: {
            ariaLabel: "{{runName}}, activate to see results"
          },
          panel_row_toggle_in_progress_row: {
            ariaLabel: "{{runName}}, activate to see progress"
          },
          panel_shot_card_failed_quality_test: {
            label: "Failed quality test"
          },
          panel_shot_card_unknown_error: {
            label: "Unknown Error"
          },
          panel_shot_card_unknown_error_description: {
            label: "Nothing has been generated"
          },
          panel_shot_card_unknown_error_info: {
            ariaLabel: "About this error"
          },
          panel_shot_card_play_video: {
            ariaLabel: "Play {{shotName}}"
          },
          panel_shot_card_pause_video: {
            ariaLabel: "Pause {{shotName}}"
          },
          run_view_image_card_quality_failure_status: {
            label: "Failed quality test"
          },
          run_view_image_card_infrastructure_failure_status: {
            label: "Failed"
          },
          run_view_image_card_quality_failure_tile: {
            label: "Failed quality test"
          },
          run_view_image_card_infrastructure_failure_tile: {
            label: "Nothing has been generated"
          },
          run_view_image_card_quality_failure_tooltip: {
            description:
              "The Bulk Rendering Agent has a quality retry feature that checks the quality of each render. If it doesn't meet the quality parameters, it will rewrite the prompt and re-render, then check quality again. The maximum number of retries is three. After that, you will see a failed quality test error."
          },
          draft_shot_card_result_chip: {
            label: "Result"
          },
          run_view_video_card_settings_info: {
            label: "Render settings Info"
          },
          run_view_video_card_settings_view_button: {
            ariaLabel: "View settings"
          },
          run_view_video_card_play_video: {
            ariaLabel: "Play {{shotName}}"
          },
          run_view_video_card_pause_video: {
            ariaLabel: "Pause {{shotName}}"
          },
          run_view_video_card_quality_failure_status: {
            label: "Failed quality test"
          },
          run_view_video_card_infrastructure_failure_status: {
            label: "Failed"
          },
          run_view_video_card_quality_failure_tile: {
            label: "Failed quality test"
          },
          run_view_video_card_infrastructure_failure_tile: {
            label: "Nothing has been generated"
          },
          run_view_video_card_quality_failure_tooltip: {
            description:
              "The Bulk Rendering Agent has a quality retry feature that checks the quality of each render. If it doesn't meet the quality parameters, it will rewrite the prompt and re-render, then check quality again. The maximum number of retries is three. After that, you will see a failed quality test error."
          },
          run_view_footer_close_button: {
            label: "Close"
          },
          run_view_footer_cancel_button: {
            label: "Cancel bulk rendering"
          },
          run_view_cancel_confirmation: {
            description: "Cancel this bulk rendering run? This can't be undone."
          },
          run_view_cancel_confirmation_dismiss_button: {
            label: "Keep rendering"
          }
        },
        renderSettings: {
          minimaxH3EditedFrame: {
            notAtRangeStart:
              "Your edited frame comes from a different frame than the start of the range. Start the range on the frame you edited."
          },
          tabs: {
            basic: { label: "Basic" },
            advanced: { label: "Advanced" },
            controlnets: { label: "Controlnets" },
            main: { label: "Main" },
            consistency: { label: "Consistency" },
            masking: { label: "Masking" },
            other: { label: "Other" },
            firstframecontrol: { label: "Control" }
          },
          sections: {
            qualitySettings: "Quality settings",
            imageInfluence: "Image influence",
            promptInfluence: "Prompt influence",
            loras: "LoRAs",
            other: "Other",
            depthAndStyleReference: "Depth and style reference",
            contextSettings: "Context settings"
          },
          mago_engine: {
            label: "Model",
            labelNotFound: "Model not found",
            cloudComingSoon:
              "Cloud rendering is not available in the desktop app yet",
            requiresSignIn: "Sign in to Mago to render with this model"
          },
          model_categories: {
            transformation_vfx: { label: "Transformation (VFX)" },
            stylization: { label: "Stylization" },
            character_replacement: { label: "Character replacement" },
            upscale: { label: "Upscale" },
            private: { label: "Private" }
          },
          preset: {
            label: "Preset"
          },
          select_placeholder: {
            label: "Select"
          },
          preset_edited: {
            label: "edited"
          },
          engine: {
            description:
              "Mago engine works great to stylize or transform any videos. You need to stylize/transform a frame that will be used as reference for the clip.\n\nMago character engine is best for character replacement where lip-sync and face expression are essential.\n\nDreamlike engine is an old-school engine, fit for more artistic renders."
          },
          upscale_engine: {
            description:
              "Upscaler stays true to the source — no added detail, no reinterpretation.\n\nCreative Upscaler generates new detail. Useful when Upscaler isn't enough.\n\nMago SDR-to-HDR expands brightness and color range for HDR displays, without changing resolution or detail."
          },
          style_reference: {
            label: "Style reference",
            mago_engine_v2: {
              description:
                "Use a style reference image to drive the stylization. Keep in mind that this includes all details in the image (colors, shapes, characters, objects); avoid images with artifacts and try to use a stylized frame of your video if possible."
            },
            mago_engine_v3: {
              description:
                "Input or generate the first frame of the clip in the style you want. It will be used as reference for the rendering process. You can try to transform elements by changing them in the first frame reference."
            }
          },
          magov2: {
            chunk_size: {
              label: "Context size",
              description:
                "Size of the context window for the generation. Lower values generate faster and keep the style better but will lose context from the previous frames."
            },
            chunk_overlap: {
              label: "Context overlap",
              description:
                "Overlap between context windows. Helps reduce sharp transitions between frames."
            },
            control_type: {
              label: "Type",
              description: "Select a controlNet to use for the generation."
            },
            lineart: {
              label: "Lineart",
              description:
                "Edge detection (i.e. outlines) in order to preserve the shapes and general details of the input video."
            },
            cn_canny_resolution: {
              label: "Canny Resolution",
              description:
                "Resolution used for controlnet maps. Higher resolutions include more details."
            },
            cn_canny_range: {
              label: "Active range",
              description:
                "Determines when the ControlNet information is used in the generation process — 0 to 1 means it is active for the whole generation, 0 to 0.8 means that the last 20% will be generated free of the ControlNet's influence."
            },
            cn_canny_strength: {
              label: "Canny Weight",
              description:
                "Edge detection (i.e. outlines) in order to preserve the shapes and general details of the input video. The weight determines how strong is the influence of the outlines information."
            },
            cfg: {
              label: "CFG",
              description:
                "The higher the CFG (prompt strength), the more impactful will be the prompt on the stylization process. Make sure to decrease the image weight first to ensure the prompt is taken into account, and try to stay within 2 to 3 for most results."
            },
            cn_depth_range: {
              label: "Active range",
              description:
                "Determines when the ControlNet information is used in the generation process — 0 to 1 means it is active for the whole generation, 0 to 0.8 means that the last 20% will be generated free of the ControlNet's influence."
            },
            cn_depth_resolution: {
              label: "Depth Resolution",
              description:
                "Resolution used for controlnet maps. Higher resolutions include more details."
            },
            cn_depth_strength: {
              label: "Depth Weight",
              description:
                "Depth detection in order to determine the 3D volumes of the scene. Helps in breaking down the frame between background, foreground and specific elements. The weight determines how strong is the influence of the depth information."
            },
            cn_tile_range: {
              label: "Active range",
              description:
                "Determines when the ControlNet information is used in the generation process — 0 to 1 means it is active for the whole generation, 0 to 0.8 means that the last 20% will be generated free of the ControlNet's influence."
            },
            cn_tile_resolution: {
              label: "Tile Resolution",
              description:
                "Resolution used for controlnet maps. Higher resolutions include more details."
            },
            cn_tile_strength: {
              label: "Tile Weight",
              description:
                "Used for upscaling/deblurring. Helps the output to stay coherent with the input video and to preserve details and colors. The weight determines how strong is the influence of the added details."
            },
            context_mode: { label: "Stability", description: "" },
            control_sdxl_xinsir_canny: {
              label: "Canny",
              description:
                "A method to detect the edges in an image, turning it into a black—and—white outline. So you can redesign objects while keeping the same outline."
            },
            control_sdxl_xinsir_depth: {
              label: "Depth",
              description:
                "Depth detection in order to determine the distance to each pixel in the frame. Helps in breaking down the frame between background, foreground and specific elements."
            },
            control_sdxl_xinsir_tile: {
              label: "Tile",
              description:
                "Breaks down the frame in small tiles and checks if details within the tile are coherent and in line with the prompt. Helps in getting rid of bad details and refine good details."
            },
            denoise: {
              label: "Denoise",
              description:
                "Denoise (or diffusion strength) indicates how different the output frame will be from the input frame. A value of 1 means the style is fully applied with no influence from the original image. A value of 0 means no style is applied and you retain the original image. It affects both image and prompt influence."
            },
            enable_interpolation: {
              label: "Interpolation",
              description:
                "The interpolation mode renders only one every two frames and use interpolation to fill in the gaps. As a result, the render is quicker and costs less credits. The output might be less detailed in occasions."
            },
            ipadapter_strength: {
              label: "Image weight",
              description:
                "Controls how strongly the reference image influences the final output. A higher weight means the generation will more closely match the reference image's style and characteristics, while a lower weight creates a more subtle influence and gives more importance to the prompt."
            },
            max_size: {
              label: "Output size",
              description:
                "Size of the longest side of your target output resolution. If your output is 1920x1080, max size is 1920. Note that the output will automatically respect the aspect ratio of your input video."
            },
            negative_prompt: {
              label: "Negative Prompt",
              description:
                "Describe what you do not want to see in the output. It can be specific elements that appear in your results and that you wish to remove, or general concepts related to quality (low resolution, bad anatomy)."
            },
            prompt: {
              label: "Prompt",
              description: "Write the prompt here"
            },
            seed: {
              label: "Seed",
              description:
                "Random number that will be the starting point of the generation. Try different values for slight variations."
            },
            steps: {
              label: "Steps",
              description:
                "Total diffusion steps: more steps result in sharper and more detailed results but slower processing. Lower steps can help achieving less refined styles. Keep the values between 3 and 10."
            },
            enable_unsampling: { label: "Unsampling", description: "" },
            enable_cache: { label: "Cache", description: "" },
            weight_type: { label: "Style mode", description: "" },
            mago_engine: {
              label: "Mago Engine",
              description:
                "Select which engine version to use. Different versions may produce different results."
            },
            firstframe_control_strength: {
              label: "Strength",
              description:
                "Controls the strength of video attention consistency enforcement. Higher values provide more temporal consistency."
            },
            firstframe_control_range: {
              label: "Active range",
              description:
                "Defines the range of frames to apply in the diffusion process (0-1 range)."
            },
            shift: {
              label: "Shift",
              description:
                "Controls the frame shift amount for temporal alignment. Higher values increase the search range for matching features."
            },
            blending_factor: {
              label: "Blending factor",
              description:
                "Controls the blending factor for the depth and lineart controlnets. Higher values will blend the two controlnets more."
            },
            cn_lineart_resolution: {
              label: "Lineart Resolution",
              description:
                "Controls the resolution of the lineart controlnet. Higher values will include more details."
            },
            cn_normal_map_resolution: {
              label: "Normal Map Resolution",
              description:
                "Controls the resolution of the normal map controlnet. Higher values will include more details."
            },
            cn_pose_resolution: {
              label: "Pose Resolution",
              description:
                "Controls the resolution of the pose controlnet. Higher values will include more details."
            },
            cn_softedge_resolution: {
              label: "Softedge Resolution",
              description:
                "Controls the resolution of the softedge controlnet. Higher values will include more details."
            },
            long_context_lora_strength: {
              label: "Long Context",
              description:
                "Controls the strength of the long context LoRA adaptation. Higher values provide better context understanding."
            },
            highres_lora_strength: {
              label: "Highres",
              description:
                "Controls the strength of the high-resolution LoRA adaptation. Higher values enhance detail rendering."
            },
            style_lora: {
              label: "Select a LoRA",
              description: "Select a LoRA to apply to the generation."
            },
            lora_strength: {
              label: "Lora weight",
              description:
                "Controls the weight of the LoRA on the final output. Higher values will enhance the LoRA's influence on the output."
            },
            enable_facemesh_blending: {
              label: "Facemesh",
              description: "Enable facemesh blending"
            },
            color_match_strength: {
              label: "Color match strength",
              description:
                "Controls how strongly the colors from the reference frame influence the output. Higher values preserve more of the original colors, while lower values allow for more creative color interpretation."
            }
          },
          auto_prompt_unavailable: {
            label: "Auto-prompting is not available for this layer."
          },
          video_description_detailed_prompt: {
            label: "Video description detailed prompt"
          },
          image_description_detailed_prompt: {
            label: "Image description detailed prompt"
          },
          use_auto_prompt: {
            label: "Use auto–prompt"
          },
          regenerate_auto_prompt: {
            label: "Regenerate"
          },
          show_auto_prompt: {
            label: "Show auto-prompt"
          },
          show_image_description: {
            label: "Show image description"
          },
          show_video_description: {
            label: "Show video description"
          },
          add_to_prompt: {
            label: "Add to prompt"
          },
          prompt_placeholder: {
            label: "Write your prompt here"
          },
          control_type: {
            depth: "Depth",
            pose: "Pose",
            pose_depth: "Pose+Depth",
            normal_map: "Normal Map (beta)",
            softedge: "SoftEdge (beta)"
          }
        },
        trackSettings: {
          chara_only: { label: "chara only" },
          with_background: { label: "w/ background" }
        },
        range: {
          max_in_credits_mode: {
            description: `Maximum render length in Credits mode is {{maxCredits}} frames`
          },
          max_in_relaxed_mode: {
            description: `{{maxFrames}} frames is the maximum range in Relaxed mode`
          },
          no_interpolation_min_range: {
            description: `{{minDefault}} frames is the minimum range`
          },
          interpolation_min_range: {
            description: "{{minFrames}} frames is the minimum range"
          },
          min_duration_seconds: {
            description:
              "Minimum render duration for this model is {{minSeconds}} seconds"
          },
          max_duration_seconds: {
            description:
              "Maximum render duration for this model is {{maxSeconds}} seconds"
          }
        },
        presets: {
          modal: {
            title: { label: "Mago presets" },
            subtitle: {
              label: "If you don't know where to start, try out our presets"
            }
          }
        },
        payment: {
          downgrade_confirmation: {
            description:
              "Your {{currentPlan}} Plan will be cancelled but remain active until {{expirationDate}}. After that, you will automatically be moved to the {{targetPlan}} Plan. Any unused credits will be carried over."
          },
          unlimited: {
            label: "Unlimited"
          },
          simultaneous_image_renders: {
            description: "Simultaneous image renders"
          },
          buy_credits_to_generate_renders: {
            description: "Buy credits to generate renders"
          },
          monthly_credits: {
            description: "Monthly Credits"
          },
          per_month: {
            description: "per month"
          },
          relaxed_mode: {
            description: "Relaxed/Unlimited mode"
          },
          relaxed_mode_cell: {
            description: "Relaxed mode"
          },
          unlimited_mode_cell: {
            description: "Unlimited mode"
          },
          relaxed_mode_cell_tooltip: {
            description:
              "Relaxed mode allows for free renders for all Mago models"
          },
          unlimited_mode_cell_tooltip: {
            description:
              "Unlimited mode allows for free renders for all Mago models and API models (Seedance, Kling, etc.)"
          },
          credit_mode: {
            description: "Credit Mode"
          },
          custom: {
            description: "Custom"
          },
          simultaneous_video_renders: {
            description: "Simultaneous video renders"
          },
          max_frames_in_a_single_run: {
            description: "Max. frames in a single run"
          },
          frames_count: { description: "{{count}} frames" },
          relaxed_basic_month: {
            description: "Relaxed mode and {{count}} credits a month"
          },
          relaxed_pro_month: {
            description: "Relaxed mode and {{count}} credits a month"
          },
          custom_separate_infrastructure: {
            description: "Separate infra, custom models, dedicated support"
          },
          cost_details: {
            title: "Cost details",
            description:
              "Credits are calculated based on models, frame range, resolution and steps."
          },
          extra_credits: {
            title: "Need extra credits?"
          },
          relaxed_mode_plan_tooltip: {
            description: "Capped at {{ frames }} frames per render"
          },
          basic_mounthly_tooltip: {
            description:
              "500 credits ≈ 1 video (5 sec, 720p, 24fps)\n500 credits ≈ 3 images"
          },
          pro_mounthly_tooltip: {
            description:
              "15000 credits ≈ 25 videos (5 sec, 720p, 24fps)\n15000 credits ≈ 90 images"
          },
          studio_month: {
            description: "{{count}} credits per month + Relaxed mode access"
          },
          studio_monthly_tooltip: {
            description: "{{count}} credits included monthly"
          },
          credit_mode_tooltip: {
            description:
              "Uses credits, launch as many simultaneous renders as you want; capped at a {{ frames }} frames limit. Ideal for tight deadlines and final production renders"
          },
          faq_title: {
            title: "Frequently asked questions"
          },
          credits_card_01: {
            videos: "8 videos (5 seconds, 720p, 24fps)",
            images: "142 images",
            price: "0.25€ per second"
          },
          credits_card_02: {
            videos: "24 videos (5 seconds, 720p, 24fps)",
            images: "428 images",
            price: "0.23€ per second"
          },
          credits_card_03: {
            videos: "72 videos (5 seconds, 720p, 24fps)",
            images: "1285 images",
            price: "0.21€ per second"
          },
          faq_disclosure_01: {
            title:
              "What's the difference between Relaxed, Unlimited and Credits mode?",
            paragraph_01:
              "Relaxed mode:\nUnlimited rendering with all Mago models, does not require credits, capped at 200 frames and two renders at a time. Perfect for experimentation and non-urgent projects. Available in Pro Plan.",
            paragraph_02:
              "Unlimited mode:\nUnlimited rendering with all Mago models and API models (Seedance, Kling, etc.), does not require credits, capped at 300 frames and three renders at a time. Perfect for experimentation and non-urgent projects. Available in Studio Plan.",
            paragraph_03:
              "Credits Mode:\nUses credits, launch as many simultaneous renders as you want; capped at a {{ count }} frames limit. Ideal for tight deadlines and final production renders. Available in all plans."
          },
          faq_disclosure_02: {
            title: "How much renders can I do with my credits?",
            paragraph_01:
              "1 second of output costs around 100 credits, which means:\n– 10000 credits allow you to generate 85 seconds\n– 30000 credits allow you to generate 250 seconds\n– 90000 credits allow you to generate 750 seconds"
          },
          faq_disclosure_03: {
            title: "Can I cancel my subscription anytime?",
            paragraph_01:
              "You can cancel anytime. Your subscription will end at the end of your billing cycle. Credits purchased or earned through Discord competitions will remain in your account for two (2) years. After this period, unused credits will expire."
          },
          faq_disclosure_04: {
            title: "I'm facing another problem. How do I contact support?",
            paragraph_01:
              "You can contact support by joining our {{ discord }}, or by directly sending us an {{ email }}."
          },
          yearly_discount: "Yearly ({{annualDiscount}}% off)",
          monthly: "Monthly",
          pack_discount: {
            description: "–{{discount}}% pack discount"
          },
          support: {
            description: "Support"
          },
          support_free: {
            description: "Discord community"
          },
          support_studio: {
            description: "Private channel (Discord/Slack)"
          },
          support_enterprise: {
            description: "Custom",
            subtitle: "(private channel, account manager, SLAs)"
          },
          onboarding_session: {
            description: "Onboarding session"
          },
          team_training: {
            description: "Team training"
          },
          dedicated_infrastructure: {
            description: "Dedicated infrastructure"
          },
          custom_models: {
            description: "Custom models"
          },
          custom_moderation_and_safeguards: {
            description: "Custom Moderation & Safeguards"
          }
        },
        modals: {
          mobile_not_supported: {
            description:
              "Mago isn't available on\u00A0mobile yet. For\u00A0the best experience, open it on\u00A0a\u00A0laptop, desktop, or\u00A0tablet.",
            confirm_desktop: "Continue anyway"
          }
        },
        img2imgForms: {
          common: {
            drag_and_drop_stylized_frame: {
              label: "Drag and drop stylized frame"
            },
            input_frame_loading_error: {
              label: "Couldn't load the input frame. Try refreshing the page."
            },
            iteration_on_frame: {
              label: "Iteration on frame {{frameNumber}}"
            },
            iteration_on_file: {
              label: "Iteration on {{fileName}}"
            },
            prompt: {
              label: "Prompt",
              tooltip:
                "Describe the transformation you want to apply to the image"
            },
            negative_prompt: {
              label: "Negative prompt",
              tooltip:
                "Describe what you do not want to see in the output. It can be specific elements that appear in your results and that you wish to remove, or general concepts related to quality (low resolution, bad anatomy)."
            },
            image_style_reference: {
              label: "Image style reference",
              tooltip:
                "Add an image and include it in the scene using the prompt as a guide",
              upload_text: "Drag and drop or click to upload reference"
            },
            seed: {
              label: "Seed"
            },
            cfg: {
              label: "CFG"
            },
            sections: {
              prompt_influence: { label: "Prompt influence" },
              image_influence: { label: "Image influence" },
              quality_settings: { label: "Quality Settings" },
              other: { label: "Other" }
            },
            frame_type: {
              from_video: { label: "From Video" },
              image_upload: { label: "Image Upload" }
            },
            tabs: {
              basic: { label: "Basic" },
              advanced: { label: "Advanced" },
              controlnets: { label: "Controlnets" }
            }
          },
          nanobanana_pro: {
            prompt: {
              tooltip:
                "Give instructions as if you were talking to an artist. For example: change the weather to rain and remove the character"
            },
            image_style_reference: {
              description:
                "You can use up to nine images to provide more context for the style"
            }
          },
          nanobanana_2: {
            prompt: {
              tooltip:
                "Give instructions as if you were talking to an artist. For example: change the weather to rain and remove the character"
            },
            resolution: {
              label: "Resolution",
              tooltip:
                "Select the output resolution. Higher resolutions cost more credits"
            }
          },
          gpt_image_2: {
            prompt: {
              tooltip:
                "Describe the edit you want to apply. You can leave it empty to rely purely on references and mask."
            },
            quality: {
              label: "Quality",
              tooltip:
                "Result size is 2K. Quality settings will not change output size but will impact the level of detail of the output. Set to High if you need precise details (such as small text, etc.)"
            },
            mask_image: {
              label: "Mask image",
              tooltip:
                "Add your frame with the area you want to edit painted in black. It will be used as the mask reference.",
              upload_text: "Drag and drop or click to upload mask"
            }
          },
          draw_mask: {
            create: "Add mask",
            edit: "Edit mask",
            add: "Add mask",
            hint: "Press and move cursor to start drawing",
            draw: "Draw",
            erase: "Erase",
            clear_all: "Clear all",
            brush_size: "Brush Size",
            cancel: "Cancel and Close",
            save: "Save",
            back_to_masked_frame: "Back to masked frame",
            delete: "Delete mask",
            frame_mismatch_warning:
              "The mask was drawn on a different frame. The masked area may not match the current frame. Consider resetting and redrawing.",
            save_mask_to_continue: "Save your mask to continue",
            red_area_tip: 'Tip: include "in the red area" in your prompt.'
          },
          qwen: {
            prompt: {
              tooltip:
                "Give direct instructions as if you were talking to an artist. For example: change the weather to rain and remove the character"
            },
            image_style_reference: {
              description:
                "You can use up to nine images to provide more context for the style"
            }
          },
          seedream_5_pro: {
            prompt: {
              tooltip:
                "Give instructions as if you were talking to an artist. For example: change the weather to rain and remove the character"
            },
            image_style_reference: {
              description:
                "You can use up to nine images to provide more context for the style"
            }
          }
        },
        auth: {
          email_placeholder: { label: "Enter your email address" },
          signin_title: { label: "Sign in to Mago Studio" },
          signup_title: { label: "Sign up to Mago Studio" }
        },
        masking: {
          mask_mode_prompt: {
            label: "Prompt",
            placeholder: "e.g. 'Person'"
          },
          mask_mode_visual_selection: { label: "Points" },
          mask_mode_prompt_and_visual_selection: {
            label: "Prompt+Points",
            placeholder: "Support your Points with the prompt"
          },
          mask_mode: {
            tooltip:
              "Create a mask using a prompt or segments. Use prompts to select all people in a frame. To select a specific person, use Visual Selection or describe them precisely, for example: person on the left in a yellow sweater. If other options don't work, try Prompt + Points"
          },
          prompt_required: { label: "Enter a masking prompt" },
          generate_disabled_add_prompt: { label: "Add prompt" },
          generate_disabled_add_points: { label: "Add points" },
          generate_disabled_add_prompt_and_points: {
            label: "Add Points and Prompt"
          },
          sam_frame_not_in_range: {
            description:
              "Points frame is outside the render range. Adjust the range or place new points."
          },
          mask_tab: {
            info_hint: {
              description:
                'Create a mask using a prompt or segments. Use prompts to select all people in a frame. To select a specific person, use Visual Selection or describe them precisely, for example: "person on the left in a yellow sweater".'
            },
            mode_switcher: {
              tooltip:
                "Prompt: describe the area to mask in natural language. Visual selection: click on the frame to place points that mark the area to include or exclude."
            }
          },
          visual_selection: {
            instruction: {
              label: "Click on frame to select area for the mask"
            },
            add_point: { label: "Add" },
            remove_point: { label: "Remove" },
            clear_all: { label: "Clear all" },
            help_text: {
              description:
                "Select + to add areas to the object, and - to remove areas from the object. Click on an existing point to delete it."
            },
            loading_model: { label: "Loading segmentation model..." },
            computing_embedding: { label: "Processing image..." },
            no_input_track: { label: "Select an input video first" },
            enlarge: { label: "Enlarge" },
            loading_error: {
              label:
                "Failed to load segmentation model. Please refresh the page."
            },
            points_required: {
              label: "Place at least one point on the frame"
            },
            open_mask_editor: {
              label: "Open Mask Editor"
            },
            editor_empty_state: {
              label: "Click to start creating"
            },
            editor_hint: {
              label:
                "Click 'Add' and select areas and objects to include in the mask. Click 'Remove' and select areas and objects to exclude from the mask. Click on an existing point to remove it."
            }
          },
          frame_warning_toast: {
            title: {
              label:
                "Your current mask doesn't apply to this frame. You can create a new one"
            },
            start_new: { label: "Start a new mask" },
            undo: { label: "Undo frame changes" }
          }
        },
        projectTimeline: {
          play: { label: "Play" },
          pause: { label: "Pause" },
          sourceVideoTrack: { label: "Source video" },
          pinnedTrack: { label: "Pinned render" },
          emptyState: { label: "No shots in this project" },
          zoomIn: { label: "Zoom in" },
          zoomOut: { label: "Zoom out" },
          imageToVideo: {
            modalTitle: { label: "Generate with AI" },
            prototypeWarning: {
              label: "You are in a prototype feature, it might be unstable."
            },
            generationsTitle: { label: "Generations" },
            emptyState: { label: "No generations yet" },
            generateButton: { label: "Generate" },
            useAsInputVideo: { label: "Use as input video for a shot" },
            downloadFailed: {
              label: "Could not download the video. Please try again."
            },
            reuseSettings: { label: "Reuse settings" },
            engineTier: {
              ariaLabel: "Generation quality",
              standard: { label: "Standard" },
              fast: { label: "Fast" },
              comparison: {
                title: { label: "Standard vs Fast (credits/seconds)" },
                ariaLabel: "Standard and Fast comparison",
                resolutionColumn: { label: "Resolution" },
                creditsPerSecond: { label: "{{credits}}/s" },
                unavailable: { label: "—" }
              }
            },
            disabledReason: {
              missingProject: {
                label: "Select a project to generate a video."
              }
            }
          }
        },
        crop: {
          mask_crop_mismatch: {
            description:
              "The selected mask was generated with a different crop. Adjust the crop or use a matching mask to continue."
          },
          image_source_crop_mismatch: {
            description:
              "The reference frame was generated with a different crop. You need to redo frame."
          },
          missing_input_dimensions: {
            description:
              "This video's dimensions are unknown, so the crop can't be applied. Try reloading the source video."
          },
          key_frame_not_cropped_warning: {
            description:
              "Your reference frame is not cropped, so it will show the full frame instead of just the cropped area."
          }
        },
        inpainting: {
          basic: {
            edit_first_frame: {
              label: "Edit First frame here",
              empty_caption: "Start by editing or uploading your first frame",
              edit_button: { label: "Edit" },
              upload_button: { label: "Upload" }
            },
            mask_input: {
              label: "Mask will be shown here",
              empty_caption: "Create a mask to define the area to edit",
              create_mask_button: { label: "Create mask" },
              change_mask_button: { label: "Change mask" }
            },
            prompt: {
              placeholder: "Support your changes with prompt"
            }
          },
          modify_frame: {
            frame_pill: { label: "Frame {{frame}}" },
            edit_key_frame: { label: "Edit Key-frame {{frame}}" },
            upload_failed: {
              description: "Upload failed on our side. Please try again."
            }
          },
          generate_disabled: {
            missing_image: { label: "Add a reference image" },
            missing_mask: {
              label: "Describe or create a mask to start generating"
            },
            missing_both: {
              label: "Add a reference image, and describe or create a mask"
            }
          },
          use_this_mask: { label: "Use this" },
          mask_range_error: {
            pill_short: {
              label: "Range error {{from}}—{{to}}",
              prefix: "Range error",
              range: "{{from}}—{{to}}"
            },
            not_in_range: {
              timeline_pill: "Mask is not inside the range",
              description:
                "The mask is not inside the range. Set the range to match the mask, or create a mask for the full clip"
            },
            shorter_than_range: {
              timeline_pill: "Mask is shorter than the range",
              description:
                "The mask is shorter than the range. Set the range to match the mask, or create a mask for the full clip"
            }
          }
        },
        plan: {
          title: { label: "Batch Plans" },
          create: { label: "Create Plan" },
          name_placeholder: { label: "Plan name (optional)" },
          timeline_selection: { label: "Select Shots (Timelines)" },
          shot_picker_title: { label: "Select Shots" },
          shot_picker_done: { label: "Done" },
          select_shots: { label: "Select shots" },
          shots_selected: { label: "{{count}} shots selected" },
          no_timelines: { label: "No timelines in this project" },
          open_modal: { label: "Agent Plan" },
          select_all: { label: "Select all" },
          clear_selection: { label: "Clear" },
          selected_count: { label: "{{selected}} / {{total}} selected" },
          render_full_shots: { label: "Render full shots" },
          render_full_shots_hint: {
            label:
              "Renders each shot's full duration. Cost is estimated from known shot durations."
          },
          frame_range: { label: "Frame Range" },
          frame_range_start: { label: "Start" },
          frame_range_end: { label: "End" },
          frame_range_invalid: { label: "Start must be less than end" },
          img2img_settings: { label: "Image Settings" },
          video_settings: { label: "Video Settings" },
          prompt: { label: "Style Prompt" },
          prompt_placeholder: { label: "e.g. anime style, vibrant colors" },
          prompt_required: { label: "Prompt is required" },
          negative_prompt: { label: "Negative Prompt" },
          render_model: { label: "Render Model" },
          render_mode: { label: "Render Mode" },
          strength: { label: "Strength" },
          frame: { label: "Frame" },
          img_file_type: { label: "Image Format" },
          engine: { label: "Engine" },
          control_type: { label: "Control Type" },
          steps: { label: "Steps" },
          cfg: { label: "CFG Scale" },
          seed: { label: "Seed" },
          max_size: { label: "Max Size" },
          submit: { label: "Start Batch" },
          cancel: { label: "Cancel Plan" },
          resume: { label: "Resume Plan" },
          back_to_list: { label: "Back to Plans" },
          no_plans: { label: "No batch plans yet. Create one to get started." },
          plan_created: { label: "Batch plan created successfully" },
          plan_cancelled: { label: "Plan cancelled" },
          plan_resumed: { label: "Plan resumed" },
          error_details: { label: "Error Details" },
          timelines_count: { label: "{{count}} shots" },
          timelines_count_index: { label: "Shot {{index}}" },
          progress: {
            label: "{{completed}} / {{total}} steps ({{percentage}}%)"
          },
          progress_timelines: {
            label: "{{completed}} / {{total}} shots ({{percentage}}%)"
          },
          progress_pct: {
            label: "{{percentage}}%"
          },
          progress_steps: {
            label: "{{completed}} / {{total}} tasks"
          },
          summary_title: { label: "Quality summary" },
          summary_runs: {
            label: "{{passed}}/{{total}} successful runs ({{rate}}%)"
          },
          summary_img: {
            label:
              "Image: {{passed}} passed · {{failed}} failed · avg {{score}}"
          },
          summary_vid: {
            label:
              "Video: {{passed}} passed · {{failed}} failed · avg {{score}}"
          },
          summary_attention: {
            label: "{{count}} need attention"
          },
          summary_shot_img_score: { label: "img {{score}}" },
          summary_shot_vid_score: { label: "video {{score}}" },
          summary_weakest: { label: "weakest: {{dim}}" },
          summary_issues: { label: "issues: {{issues}}" },
          attention_reason: {
            img_all_failed: { label: "Image failed all attempts" },
            vid_never_passed: { label: "Video never passed" },
            vid_not_evaluated: { label: "Video not evaluated" },
            borderline_pass: { label: "Borderline pass" },
            max_retries_used: { label: "Max retries used" },
            not_evaluated: { label: "Not evaluated" }
          },
          cancel_confirm: {
            label: "Are you sure you want to cancel this plan?"
          },
          cancel_confirm_yes: { label: "Yes, cancel" },
          cancel_confirm_no: { label: "No, keep running" },
          filter_all: { label: "All" },
          filter_running: { label: "Running" },
          filter_completed: { label: "Completed" },
          filter_failed: { label: "Failed" },
          filter_cancelled: { label: "Cancelled" },
          status: {
            PENDING: { label: "Pending" },
            RUNNING: { label: "Running" },
            PAUSED: { label: "Paused" },
            COMPLETED: { label: "Completed" },
            FAILED: { label: "Failed" },
            CANCELLED: { label: "Cancelled" }
          },
          step_tool: {
            get_timeline_info: { label: "Get Timeline Info" },
            get_project_info: { label: "Get Project Info" },
            adapt_prompt_img: { label: "Adapting prompt" },
            submit_img2img: { label: "Submit Image Stylization" },
            poll_img2img: { label: "Stylising frame" },
            submit_img_metrics: { label: "Submit Image Metrics" },
            poll_img_metrics: { label: "Checking image quality" },
            img_quality_gate: { label: "Image quality gate" },
            poll_img_retry: { label: "Re-rendering image (quality)" },
            img_quality_final: { label: "Image quality final" },
            create_render_layer: { label: "Create Render Layer" },
            submit_video_render: { label: "Submit Video Render" },
            poll_video_render: { label: "Rendering video" },
            submit_vid_metrics: { label: "Submit Video Metrics" },
            poll_vid_metrics: { label: "Checking video quality" },
            vid_quality_gate: { label: "Video quality gate" },
            poll_vid_retry: { label: "Re-rendering video (quality)" },
            poll_prev_shot_complete: { label: "Waiting for previous shot" },
            submit_pick_keyframes: { label: "Selecting reference frame" },
            poll_pick_keyframes: { label: "Selecting reference frame" },
            use_provided_reference_frame: {
              label: "Using uploaded reference image"
            },
            shot_context: { label: "Reading the shot" },
            adapt_prompt_i2v: { label: "Adapting prompt" },
            submit_shot_video_prompt: { label: "Writing the shot prompt" },
            poll_shot_video_prompt: { label: "Waiting for the shot prompt" },
            submit_stitch_refs: { label: "Combining references" },
            poll_stitch_refs: { label: "Combining references" },
            submit_img2img_batch: { label: "Submit reference images" },
            poll_img2img_batch: { label: "Rendering reference images" },
            submit_img_metrics_batch: { label: "Submit image scoring" },
            poll_img_metrics_batch: { label: "Scoring reference images" },
            submit_script_casting: { label: "Reading the script" },
            poll_script_casting: { label: "Casting the script" },
            plan_scenario_shots: { label: "Planning the shots" },
            spawn_scenario_child: { label: "Starting the shot renders" },
            poll_scenario_child: { label: "Rendering the shots" },
            create_project: { label: "Create Project" },
            create_shot: { label: "Create Shot" },
            materialise_project_state: { label: "Preparing the project" },
            shot_video_source: { label: "Reading the source video" },
            submit_stitch_sheets: { label: "Combining reference sheets" },
            poll_stitch_sheets: { label: "Combining reference sheets" },
            batch_complete_gate: { label: "Reference images gate" },
            poll_prev_step_complete: { label: "Waiting for the previous step" },
            run_summary: { label: "Summarising the run" }
          },
          step_result: { label: "Result" },
          step_args: { label: "Arguments" },
          estimated_cost: { label: "Estimated cost" },
          cost_img2img: { label: "Image" },
          cost_video: { label: "Video" },
          confirm_start: {
            label:
              "This will cost ~{{cost}} credits for {{count}} shots. Start?"
          },
          confirm_start_yes: { label: "Start" },
          confirm_start_no: { label: "Cancel" },
          started_at: { label: "Started" },
          finished_at: { label: "Finished" },
          retries: { label: "Retries" },
          step_status: {
            PENDING: { label: "Pending" },
            RUNNING: { label: "Running" },
            COMPLETED: { label: "Done" },
            FAILED: { label: "Failed" },
            SKIPPED: { label: "Skipped" }
          },
          untitled: { label: "Untitled Plan" },
          debug_view: { label: "Debug view" },
          no_shots: { label: "No shots yet" },
          collapse: { label: "Collapse shot" },
          expand: { label: "Expand shot" },
          phase: {
            img2img: { label: "Stylise frame" },
            video: { label: "Render video" },
            input_frame: { label: "Input" },
            result: { label: "Result" },
            references: { label: "References" },
            waiting_prev: { label: "Waiting for previous shot…" },
            prev_failed: {
              label: "Previous shot failed — this shot is blocked"
            },
            keyframe_handoff: { label: "Reference for next shot" }
          },
          metric: {
            pass: { label: "Passed" },
            fail: { label: "Failed" },
            unscored: { label: "Unscored" },
            details: { label: "Quality details" }
          },
          timeline_summary: {
            running: { label: "Running" },
            failed: { label: "Failed" },
            done: { label: "Done" },
            pending: { label: "Pending" }
          },
          step_result_image_alt: { label: "Step result" },
          include_video: { label: "Include video rendering" },
          skip_polling_img2img: {
            label: "Skip polling (fire-and-forget)"
          },
          skip_polling_video: {
            label: "Skip video polling (fire-and-forget)"
          },
          skip_polling_disabled_hint: {
            label: "Cannot skip img2img polling when video is enabled"
          },
          skip_metrics: {
            label: "Skip metrics evaluation"
          },
          use_adapt_prompt: {
            label: "Adapt prompt to scene (Gemini)"
          },
          sequential_shots: {
            label: "Sequential shots (cross-shot consistency)"
          },
          sequential_shots_hint: {
            label:
              "Renders shots one at a time in the selected order, seeding each shot with the previous shot's keyframe(s)."
          },
          sequential_shots_disabled_hint: {
            label: "Enable video rendering to use sequential shots."
          },
          label_style_refs: {
            label: "Label style references (STYLE REF)"
          },
          label_cross_shot_refs: {
            label: "Label cross-shot references (PREV SHOT)"
          },
          cross_shot_prompt_suffix: {
            label: "PREV SHOT prompt suffix"
          },
          cross_shot_prompt_suffix_placeholder: {
            label: "Server default (leave blank)"
          },
          cross_shot_metrics: {
            label: "Score cross-shot consistency (VLM judge)"
          },
          keyframe_num_candidates: {
            label: "Keyframe candidates per shot"
          },
          keyframe_num_select: {
            label: "Keyframes selected per shot"
          },
          img2img_quality_retries: {
            label: "Img2img quality retries (0–5)"
          },
          video_quality_retries: {
            label: "Video quality retries (0–5)"
          },
          video_quality_retries_unsupported_hint: {
            label:
              "This engine renders in one pass — quality retries are not available."
          },
          video_only_engine_hint: {
            label:
              "This engine renders straight from the source video — no reference image needed."
          },
          reuse_settings: {
            label: "Reuse settings"
          },
          reuse_failed: {
            label: "Failed to load plan settings"
          },
          reuse_img2img_failed: {
            label: "Img2img settings could not be restored"
          },
          reuse_img2img_model_changed: {
            label:
              "Img2img model was reset — original model no longer available"
          },
          reuse_video_engine_excluded: {
            label:
              "Video engine was reset — original engine not available for plans"
          },
          reuse_shot_images_failed: {
            label: "Shot image assignments could not be restored"
          },
          shot_images: {
            title: { label: "Shot Images" },
            hint: {
              label:
                'Upload your own reference images and they\'ll be auto-assigned to shots whose name matches the start of the filename (e.g. "shot_1_v2.jpg" for a shot named "shot_1"). Assigned shots skip img2img and use the image directly as the video reference frame.'
            },
            upload_zone: {
              label: "Upload shot images",
              description: "Drop images here or click to browse"
            },
            upload_failed: {
              description: "Upload failed. Please try again."
            },
            status_matched: { label: "Matched" },
            status_needs_review: { label: "Needs review" },
            status_unmatched: { label: "No image" },
            no_image_option: { label: "No image" },
            unmatched_notice: {
              label:
                "These uploaded images didn't match any selected shot: {{fileNames}}"
            }
          }
        },
        longForm: {
          scriptPlaceholder: { label: "Paste your script here" },
          submit: { label: "Generate" },
          submitFailed: {
            label: "Couldn't start the run. Please try again."
          },
          cancel: { label: "Cancel run" },
          emptyState: {
            label: "Your videos will appear here once generated",
            failed: {
              label: "Your run failed and no videos were generated."
            }
          },
          phase: {
            readingScript: { label: "Reading the script" },
            planningShots: { label: "Planning the shots" },
            drawingCastAndSets: { label: "Drawing the cast and sets" },
            preparingReferences: { label: "Preparing references" },
            renderingShots: { label: "Rendering the shots" }
          },
          outcome: {
            completed: { label: "Run completed" },
            failed: { label: "Run failed" }
          },
          shotState: {
            notStarted: { label: "Not started" },
            rendering: { label: "Rendering" },
            failed: { label: "Nothing has been generated" }
          },
          downloadPending: {
            label: "Every shot has to finish rendering first."
          },
          downloadAll: {
            label: "Download all videos",
            started: { label: "Preparing your download..." },
            succeeded: { label: "Download ready" },
            failed: { label: "Couldn't download any shots" },
            partial: {
              label: "Some shots could not be included in the download"
            },
            nothingGenerated: {
              label: "No shot was generated, so there is nothing to download."
            }
          },
          downloadEdit: {
            label: "Download as one video",
            started: { label: "Preparing your download..." },
            succeeded: { label: "Download ready" },
            failed: { label: "Couldn't download the video" },
            notJoinable: {
              label:
                "These shots can't be joined into one video. Use Download all videos instead."
            },
            requiresEveryShot: {
              label:
                "This needs every shot to have rendered successfully. Use Download all videos instead."
            }
          }
        }
      }
    }
  }
});

export { i18n };
