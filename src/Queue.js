/* eslint-disable @typescript-eslint/no-empty-function */
export class Queue {
    #data = [];

    /**@params { data: unknown[] } data */
    constructor(data) {
        if (Array.isArray(data)) this.#data = data;
    }

    // eslint-disable-next-line @typescript-eslint/no-empty-function
    get length() {
        return this.#data.length;
    }

    enqueue(_item) {
        this.#data.push(_item);
    }

    dequeue() {
        if (this.length > 0) this.#data.shift();
    }

    peek() {
        if (this.size > 0) {
            return this.#data[this.size - 1];
        } else {
            return null;
        }
    }
}