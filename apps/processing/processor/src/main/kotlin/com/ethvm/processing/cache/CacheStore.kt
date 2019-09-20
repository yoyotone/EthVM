package com.ethvm.processing.cache

import com.google.common.cache.CacheBuilder
import com.google.common.cache.CacheLoader
import org.mapdb.DB
import org.mapdb.Serializer
import java.util.concurrent.ScheduledExecutorService
import java.util.concurrent.TimeUnit

/**
 * Utility for managing the interoperation of in memory and disk based db instances
 */
class CacheStore<K, V>(
  diskDb: DB,
  name: String,
  keySerializer: Serializer<K>,
  valueSerializer: Serializer<V>,
  defaultValue: V,
  maxItems: Long = 1024
) {

  // persistent on disk
  private val persistentMap = diskDb
    .hashMap(name)
    .keySerializer(keySerializer)
    .valueSerializer(valueSerializer)
    .createOrOpen()

  // in memory cache with read thru to persistent map
  private val cacheMap = CacheBuilder
    .newBuilder()
    .maximumSize(maxItems)
    .build<K, V>(MyCacheLoader(persistentMap, defaultValue))

  operator fun set(key: K, value: V?) {
    cacheMap.put(key, value)
    persistentMap[key] = value
  }

  operator fun get(key: K): V? = cacheMap.get(key)

  fun clear() {
    // remove all entires from in memory
    cacheMap.invalidateAll()

    // remove all persistent entries
    persistentMap.clear()
  }

  private inner class MyCacheLoader(
    private val persistentMap: Map<K, V>,
    private val defaultValue: V
  ) : CacheLoader<K, V>() {
    override fun load(key: K): V? = persistentMap.getOrDefault(key, defaultValue)
  }

}
