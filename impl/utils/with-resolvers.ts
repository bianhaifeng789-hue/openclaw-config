// @ts-nocheck

/**
 * With-Resolvers Polyfill Pattern - Promise.withResolvers polyfill
 * 
 * Source: Claude Code utils/withResolvers.ts
 * Pattern: Promise.withResolvers polyfill + resolve/reject external + pending state
 */

interface PromiseWithResolvers<T> {
  promise: Promise<T>
  resolve: (value: T | PromiseLike<T>) => void
  reject: (reason?: any) => void
}

interface PendingPromise<T> extends PromiseWithResolvers<T> {
  status: 'pending' | 'resolved' | 'rejected'
  value?: T
  reason?: any
}

class WithResolversPolyfill {
  /**
   * Promise.withResolvers polyfill
   * Creates promise with resolve/reject exposed
   */
  withResolvers<T>(): PromiseWithResolvers<T> {
    let resolve: (value: T | PromiseLike<T>) => void
    let reject: (reason?: any) => void

    const promise = new Promise<T>((res, rej) => {
      resolve = res
      reject = rej
    })

    return {
      promise,
      resolve: resolve!,
      reject: reject!
    }
  }

  /**
   * Pending promise with status tracking
   */
  pending<T>(): PendingPromise<T> {
    let resolve: (value: T | PromiseLike<T>) => void
    let reject: (reason?: any) => void

    const state: PendingPromise<T> = {
      promise: new Promise<T>((res, rej) => {
        resolve = (value) => {
          state.status = 'resolved'
          state.value = value as T
          res(value)
        }
        reject = (reason) => {
          state.status = 'rejected'
          state.reason = reason
          rej(reason)
        }
      }),
      resolve: undefined as any,
      reject: undefined as any,
      status: 'pending'
    }

    state.resolve = resolve!
    state.reject = reject!

    return state
  }

  /**
   * Deferred promise (classic deferred pattern)
   */
  deferred<T>(): {
    promise: Promise<T>
    resolve: (value: T) => void
    reject: (reason?: any) => void
    isResolved: () => boolean
    isRejected: () => boolean
    isPending: () => boolean
  } {
    const pending = this.pending<T>()

    return {
      promise: pending.promise,
      resolve: pending.resolve,
      reject: pending.reject,
      isResolved: () => pending.status === 'resolved',
      isRejected: () => pending.status === 'rejected',
      isPending: () => pending.status === 'pending'
    }
  }

  /**
   * Create timeout promise with resolvers
   */
  timeout<T>(ms: number, onTimeout?: () => T): PromiseWithResolvers<T> & { cancel: () => void } {
    const { promise, resolve, reject } = this.withResolvers<T>()

    const timer = setTimeout(() => {
      if (onTimeout) {
        resolve(onTimeout())
      } else {
        reject(new Error(`Timeout after ${ms}ms`))
      }
    }, ms)

    const cancel = () => {
      clearTimeout(timer)
      reject(new Error('Timeout cancelled'))
    }

    // Unref timer
    if (typeof timer.unref === 'function') {
      timer.unref()
    }

    return { promise, resolve, reject, cancel }
  }

  /**
   * Race with resolvers (multiple promises)
   */
  raceWithResolvers<T>(promises: Promise<T>[]): PromiseWithResolvers<T> & { cancel: () => void } {
    const { promise, resolve, reject } = this.withResolvers<T>()

    const cleanup = () => {
      // Would cancel any pending promises if they support cancellation
    }

    Promise.race(promises)
      .then(value => {
        cleanup()
        resolve(value)
      })
      .catch(reason => {
        cleanup()
        reject(reason)
      })

    return { promise, resolve, reject, cancel: cleanup }
  }

  /**
   * Create lazy promise (only executes when awaited)
   */
  lazy<T>(fn: () => Promise<T>): Promise<T> & { execute: () => void } {
    let executed = false
    let { promise, resolve, reject } = this.withResolvers<T>()

    const execute = () => {
      if (executed) return
      executed = true

      fn()
        .then(resolve)
        .catch(reject)
    }

    // Override then to trigger execution
    const lazyPromise = {
      then: (onFulfilled?: (value: T) => any, onRejected?: (reason: any) => any) => {
        execute()
        return promise.then(onFulfilled, onRejected)
      },
      catch: (onRejected?: (reason: any) => any) => {
        execute()
        return promise.catch(onRejected)
      },
      finally: (onFinally?: () => void) => {
        execute()
        return promise.finally(onFinally)
      },
      execute
    }

    return lazyPromise as any
  }

  /**
   * Reset for testing
   */
  _reset(): void {
    // No state
  }
}

// Global singleton
export const withResolversPolyfill = new WithResolversPolyfill()

// Export convenience function
export const withResolvers = withResolversPolyfill.withResolvers.bind(withResolversPolyfill)

export default withResolversPolyfill