export class Buffer<T> {
  capacity: number;
  items: T[];
  private start = 0;
  private end = 0;
  private full = false;

  constructor(capacity: number) {
    this.capacity = capacity;
    this.items = new Array<T>(capacity);
  }

  empty(): boolean {
    return !this.full && this.start === this.end;
  }

  add(item: T) {
    this.items[this.end] = item;
    this.end = (this.end + 1) % this.capacity;
    if (this.full) {
      this.start = (this.start + 1) % this.capacity;
    }
    if (this.end === this.start) {
      this.full = true;
    }
  }

  [Symbol.iterator](): Iterator<T> {
    let count = this.full ? this.capacity : this.end - this.start;
    if (count < 0) count += this.capacity;
    let idx = this.start;
    let iterated = 0;
    return {
      next: (): IteratorResult<T> => {
        if (iterated >= count) {
          return { done: true, value: undefined };
        }
        const value = this.items[idx];
        idx = (idx + 1) % this.capacity;
        iterated++;
        return { done: false, value };
      },
    };
  }

  /**
   * Returns the most recently added item, or undefined if buffer is empty.
   */
  current(): T | undefined {
    if (this.empty()) {
      return undefined;
    }

    // The last item is at (end - 1 + capacity) % capacity
    const idx = (this.end - 1 + this.capacity) % this.capacity;
    return this.items[idx];
  }
}
