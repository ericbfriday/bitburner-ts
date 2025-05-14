export class Stack {
    #data;

    constructor() {
        this.#data = [];
    }

    get size() {
        return this.#data.length;
    }

    push(item) {
        this.#data.push(item);
    }

    pop() {
        return this.#data.pop();
    }

    peek() {
        if (this.size > 0) {
            return this.#data[this.size - 1];
        } else {
            return null;
        }
    }
}