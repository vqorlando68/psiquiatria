declare module "oracledb" {
  namespace oracledb {
    export interface Pool {
      getConnection(): Promise<Connection>;
      close(forceTimeout?: number): Promise<void>;
    }
    export interface Connection {
      execute<T>(sql: string, binds?: BindParameters | any[], options?: ExecuteOptions): Promise<Result<T>>;
      close(): Promise<void>;
      commit(): Promise<void>;
      rollback(): Promise<void>;
    }
    export interface Result<T> {
      rows?: T[];
      rowsAffected?: number;
      outBinds?: any;
    }
    export type BindParameters = any;
    export type ExecuteOptions = any;

    export const OUT_FORMAT_OBJECT: number;
    export const BIND_IN: number;
    export const BIND_OUT: number;
    export const STRING: number;
    export const NUMBER: number;

    export let initOracleClient: (options?: any) => void;
    export let thin: boolean;
    export function createPool(config: any): Promise<Pool>;
  }

  export default oracledb;
}
