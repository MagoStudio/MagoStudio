export class NodePackAlreadyInstalledError extends Error {
  constructor(readonly nodePackDirectory: string) {
    super(`The node pack folder already exists: ${nodePackDirectory}`);
    this.name = "NodePackAlreadyInstalledError";
  }
}
