export class ResultModel<Presenter> {
  constructor(
    public message: string,
    public success: boolean,
    public data: Presenter,
    public error: any,
  ) {}
}

export class DeleteResultModel {
  generatedMaps: any[];
  raw: any[];
  affected: number
}
