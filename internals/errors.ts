export class MaestroChannelError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MaestroChannelError";
  }
}

export class MaestroPermissionsError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MaestroPermissionsError";
  }
}
