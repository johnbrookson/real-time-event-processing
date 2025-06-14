export class Result<T> {
  public isSuccess: boolean;
  public isFailure: boolean;
  public error: Error | null;
  private readonly _value: T | null;

  private constructor(isSuccess: boolean, error: Error | null, value: T | null) {
    this.isSuccess = isSuccess;
    this.isFailure = !isSuccess;
    this.error = error;
    this._value = value;

    Object.freeze(this);
  }

  public getValue(): T {
    if (!this.isSuccess) {
      throw new Error('Cannot get the value of an error result.');
    }

    return this._value as T;
  }

  public static ok<U>(value?: U): Result<U> {
    return new Result<U>(true, null, value || null);
  }

  public static fail<U>(error: Error): Result<U> {
    return new Result<U>(false, error, null);
  }

  public static combine<U>(results: Result<U>[]): Result<U> {
    for (const result of results) {
      if (result.isFailure) return result;
    }
    return Result.ok();
  }
} 