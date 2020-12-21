import { EventEmitter } from "events";

declare function FunctionReturnPromise(): Promise<any>

interface QueueOptions {
  /**
   * @property {number} [options.executors=2]  How many executors should take task in parallel
   */
  executors?: number;
  /**
   * * @property {number=}  [options.timeout=7000]    Timeout from previous task start to prohibit concurrent start
   */
  timeout?: number;
}

interface QueueEvents {
  'start': () => void;
  'stop': () => void;
  'end': () => void;
  'starting_task': (id: string, remaining: number) => void;
  'resolve': (value: any) => void;
  'reject': (err: any) => void;
  'next': () => void;
}

declare class Queue extends EventEmitter {
  readonly options: QueueOptions;
  readonly isEmpty: boolean;
  readonly shouldRun: boolean;

  constructor(options?: QueueOptions);

  enqueue(task: typeof FunctionReturnPromise, id: string | undefined): void;
  stop(): void

  on<U extends keyof QueueEvents>(
    event: U, listener: QueueEvents[U]
  ): this;
}


export = Queue;