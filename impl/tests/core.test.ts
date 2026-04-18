// @ts-nocheck

import { describe, it, expect, beforeEach } from 'vitest'
import { resetAll, getAllStats } from '../utils/index'
import { abortSafeSleep } from '../utils/abort-safe-sleep'
import { activityManager } from '../utils/activity-manager'
import { circularBuffer } from '../utils/circular-buffer-wrapper'
import { queueService } from '../utils/queue-service'
import { streamService } from '../utils/stream-service'

describe('Core Patterns', () => {
  beforeEach(() => {
    resetAll()
  })

  describe('abortSafeSleep', () => {
    it('should create sleep with abort', () => {
      const result = abortSafeSleep.sleepWithAbort(1000)
      expect(result.promise).toBeDefined()
      expect(result.abort).toBeDefined()
    })

    it('should have stats', () => {
      abortSafeSleep.sleepWithAbort(100)
      const stats = abortSafeSleep.getStats()
      expect(stats.sleepsCount).toBe(1)
    })
  })

  describe('activityManager', () => {
    it('should start activity', () => {
      const activity = activityManager.start('test', 'test description')
      expect(activity).toBeDefined()
      expect(activity.id).toBeDefined()
    })

    it('should end activity', () => {
      const activity = activityManager.start('test', 'desc')
      const result = activityManager.end(activity.id)
      expect(result).toBe(true)
    })

    it('should have stats', () => {
      activityManager.start('test', 'desc')
      const stats = activityManager.getStats()
      expect(stats.activitiesCount).toBeGreaterThan(0)
    })
  })

  describe('circularBuffer', () => {
    it('should write and read', () => {
      circularBuffer.write('test-data')
      const data = circularBuffer.read()
      expect(data.length).toBe(1)
      expect(data[0]).toBe('test-data')
    })

    it('should clear', () => {
      circularBuffer.write('a')
      circularBuffer.write('b')
      circularBuffer.clear()
      expect(circularBuffer.read().length).toBe(0)
    })
  })

  describe('queueService', () => {
    it('should add items', () => {
      queueService.add('item1')
      queueService.add('item2')
      const stats = queueService.getStats()
      expect(stats.queueSize).toBe(2)
    })

    it('should process items', () => {
      queueService.add('item1')
      const item = queueService.processNext()
      expect(item).toBeDefined()
      expect(item?.data).toBe('item1')
    })
  })

  describe('streamService', () => {
    it('should write chunks', () => {
      streamService.write('chunk1')
      streamService.write('chunk2')
      expect(streamService.getChunkCount()).toBe(2)
    })

    it('should read all', () => {
      streamService.write('a')
      streamService.write('b')
      expect(streamService.readAll()).toBe('ab')
    })
  })
})

describe('Global Functions', () => {
  beforeEach(() => {
    resetAll()
  })

  it('resetAll should clear all services', () => {
    activityManager.start('test', 'desc')
    circularBuffer.write('data')
    resetAll()
    expect(activityManager.getStats().activitiesCount).toBe(0)
    expect(circularBuffer.read().length).toBe(0)
  })

  it('getAllStats should return stats from all services', () => {
    activityManager.start('test', 'desc')
    circularBuffer.write('data')
    const stats = getAllStats()
    expect(stats).toBeDefined()
    expect(typeof stats).toBe('object')
    expect(stats.activityManager).toBeDefined()
    expect(stats.circularBuffer).toBeDefined()
  })
})