const EventEmitter = require('events');

const State = {
    pending: 0,
    running: 1,
    finished: 2
};

/**
 * Queue library for promise-based tasks with timeout from previous task start.
 * @class   Queue
 * @extends EventEmitter
 */
module.exports = class Queue extends EventEmitter {
    /**
     * @type    {Map<Promise,string>}
     * @access  private
     */
    backlog = new Map();
    /**
     * @type    {number}
     * @access  private
     */
    previousStartTime;
    /**
     * timeoutID from latest task run
     * @type    {TimeoutID}
     * @access  private
     */
    timeoutId;
    /**
     * @type    {number}  number of executors for tasks
     * @access  private
     */
    runningExecutors = 0;
    /**
     * @type    {State}
     * @access  public
     */
    state = State.pending;
    /**
     * @type    {number} counter for generating key identifier for tasks
     * @access  private
     */
    counter = 0;
    /**
     * @type    {Object}  options
     * @type    {number} [options.executors=2]  How many executors should take task in parallel
     * @type    {number=}  [options.timeout=7000]    Timeout from previous task start to prohibit concurrent start
     * @access  public
     */
    options = {
        executors: 2,
        timeout: 1000
    };

    /**
     * Initializes a new queue instance with provided options.
     *
     * @type    {Object}  options
     * @type    {number}  options.executors  How many executors should take task in parallel
     * @type    {number}  options.timeout    Timeout from previous task start to prohibit concurrent start
     * @return  {Queue}
     */
    constructor(options = {}) {
        super();
        this.options = { ...this.options, ...options };
    }

    /**
     * Starts runner in case it has not been started
     * @emits   start
     * @return  {void}
     * @access  private
     */
    start() {
        if (this.state !== State.running && !this.isEmpty) {
            this.state = State.running;
            this.emit('start');

            (async () => {
                while (this.shouldRun) {
                    await this.next();
                }
            })();
        }
    }

    /**
     * Stop the queue
     *
     * @emits   stop
     * @return  {void}
     * @access  public
     */
    stop() {
        clearTimeout(this.timeoutId);
        this.backlog.clear();
        this.state = State.finished;
        this.emit('stop');
    }

    /**
     * Stop queue in case no running tasks and queue is empty
     * @emits   end
     * @return  {void}
     * @access  private
     */
    finish() {
        this.runningExecutors -= 1;

        if (this.runningExecutors === 0 && this.isEmpty) {
            this.stop();

            this.state = State.pending;

            this.emit('end');
        }
    }

    /**
     * Execute promise from queue and check if there is enough executors for one more
     *
     * @return  {Promise<any>}
     * @emits   resolve
     * @emits   reject
     * @emits   next
     * @access  private
     */
    async execute() {
        const [id] = this.backlog.keys();
        const promise = this.backlog.get(id);

        if (this.runningExecutors < this.options.executors) {
            this.runningExecutors++;
            this.emit('starting_task', id, this.backlog.size);
            this.backlog.delete(id);
        }

        // check if another executor available
        if (this.runningExecutors < this.options.executors) {
            this.emit('next');
            this.next();
        }

        const output = await Promise.resolve(promise())
            .then((value) => {
                this.emit('resolve', value);
                return value;
            })
            .catch((error) => {
                this.emit('reject', error);
                return error;
            })
            .finally(() => {
                this.emit('next');
                this.finish();
            });

        return output;
    }

    /**
     * check if timeout should be applied for executing next task
     *
     * @return  {Promise<any>}
     * @emits   resolve
     * @emits   reject
     * @emits   next
     * @access  private
     */
    next() {
        const { timeout } = this.options;

        return new Promise((resolve, reject) => {
            if (!this.previousStartTime) {
                this.previousStartTime = Date.now() - timeout;
            }

            if (this.timeoutId && !this.timeoutId._destroyed) {
                // existing timeout is active, try again next time :)
                return;
            }

            clearTimeout(this.timeoutId);

            const newTimeout = timeout - (Date.now() - this.previousStartTime);

            return new Promise(
                (resolve) => (this.timeoutId = setTimeout(resolve, newTimeout))
            ).then(() => {
                this.previousStartTime = Date.now();
                this.execute().then(resolve);
            });
        });
    }

    /**
     * Adds task to the backlog.
     * @param   {Function<Promise>}  task     Tasks to add to the queue
     * @param   {string|undefined}  key     Task identifier, if not provided generated automatically
     * @throws  {Error}                     if task is not a function or promise
     * @return  {void}
     * @access  public
     */
    enqueue(task, id) {
        if (!id) {
            id = (this.counter + 1) % Number.MAX_SAFE_INTEGER;
            this.counter += 1;
        }
        this.backlog.set(`${id}`, task);

        if (this.state !== State.running) {
            this.start();
        }
    }

    /**
     * Checks if there is no more tasks
     * @type    {boolean}
     * @access  public
     */
    get isEmpty() {
        return this.backlog.size === 0;
    }

    /**
     * Checks if backlog is not empty and queue not finished
     * @type    {boolean}
     * @access  public
     */
    get shouldRun() {
        return !this.isEmpty && this.state !== State.finished;
    }
};
