export interface BaseService<BaseServiceInput = unknown, BaseServiceOutput = unknown> {
  execute(input: BaseServiceInput): Promise<BaseServiceOutput>;
}
