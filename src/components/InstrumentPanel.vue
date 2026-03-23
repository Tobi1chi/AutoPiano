<style lang="less">
@import url('../assets/style/variable.less');

.component-instrument-panel {
  width: 90%;
  margin: 0 auto 24px;
  padding: 20px 24px 24px;
  background: rgba(255, 255, 255, 0.84);
  border: solid 1px rgba(0, 0, 0, 0.08);
  border-radius: 12px;
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.08);

  .panel-head {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 18px;
  }

  .panel-title {
    margin: 0;
    font-size: 22px;
    color: @c-black;
  }

  .panel-subtitle {
    margin-top: 6px;
    color: #666;
    font-size: 13px;
    user-select: text;
  }

  .active-summary {
    font-size: 13px;
    color: #666;
    text-align: right;
    user-select: text;
  }

  .instrument-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
  }

  .instrument-card {
    width: calc(50% - 8px);
    min-width: 280px;
    padding: 16px;
    border-radius: 12px;
    background: rgba(255, 255, 255, 0.96);
    border: solid 1px rgba(18, 149, 219, 0.1);
  }

  .instrument-card.is-current {
    border-color: rgba(18, 149, 219, 0.45);
    box-shadow: 0 0 0 2px rgba(18, 149, 219, 0.08);
  }

  .instrument-head {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 10px;
  }

  .instrument-name {
    margin: 0;
    font-size: 18px;
    color: @c-black;
  }

  .instrument-family {
    margin-top: 5px;
    color: #666;
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }

  .status-chip,
  .meta-chip {
    display: inline-flex;
    align-items: center;
    height: 24px;
    padding: 0 10px;
    border-radius: 999px;
    font-size: 12px;
    white-space: nowrap;
  }

  .status-chip.ready {
    background: rgba(7, 226, 109, 0.14);
    color: #14864b;
  }

  .status-chip.loading {
    background: rgba(18, 149, 219, 0.14);
    color: @c-blue-d;
  }

  .status-chip.error {
    background: rgba(239, 73, 111, 0.14);
    color: @c-red;
  }

  .status-chip.idle {
    background: rgba(0, 0, 0, 0.06);
    color: #666;
  }

  .instrument-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 12px;
  }

  .meta-chip {
    background: rgba(18, 149, 219, 0.1);
    color: @c-blue-d;
  }

  .instrument-description {
    min-height: 40px;
    margin: 0 0 12px;
    font-size: 13px;
    color: #555;
    line-height: 1.6;
    user-select: text;
  }

  .instrument-status-text {
    min-height: 18px;
    margin-bottom: 12px;
    font-size: 12px;
    color: #666;
    user-select: text;
  }

  .instrument-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .action-btn {
    min-width: 86px;
    height: 34px;
    border: none;
    border-radius: 999px;
    padding: 0 14px;
    font-size: 13px;
    cursor: pointer;
    transition: opacity 0.15s ease, transform 0.15s ease;
  }

  .action-btn:hover {
    transform: translateY(-1px);
  }

  .action-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }

  .action-btn.primary {
    background: @c-blue;
    color: #fff;
  }

  .action-btn.secondary {
    background: rgba(18, 149, 219, 0.12);
    color: @c-blue-d;
  }

  .action-btn.ghost {
    background: rgba(0, 0, 0, 0.06);
    color: #555;
  }

  @media (max-width: 900px) {
    .panel-head {
      flex-direction: column;
      align-items: flex-start;
    }

    .active-summary {
      text-align: left;
    }

    .instrument-card {
      width: 100%;
      min-width: 0;
    }
  }
}
</style>

<template>
  <div class="component-instrument-panel">
    <div class="panel-head">
      <div>
        <h3 class="panel-title">音色面板</h3>
        <div class="panel-subtitle">支持本地与远程采样，切换失败时保留当前可用音色继续演奏。</div>
      </div>
      <div class="active-summary">
        <div>当前音色：{{ currentInstrumentLabel }}</div>
        <div v-if="currentResolvedSource">当前来源：{{ sourceLabel(currentResolvedSource) }}</div>
        <div>默认音色：{{ defaultInstrumentLabel }}</div>
      </div>
    </div>

    <div class="instrument-grid">
      <div
        v-for="instrument in instruments"
        :key="instrument.id"
        class="instrument-card"
        :class="{ 'is-current': instrument.id === currentInstrumentId }"
      >
        <div class="instrument-head">
          <div>
            <h4 class="instrument-name">{{ instrument.label }}</h4>
            <div class="instrument-family">{{ instrument.family }}</div>
          </div>
          <span class="status-chip" :class="statusClass(instrument.id)">{{ statusLabel(instrument.id) }}</span>
        </div>

        <div class="instrument-meta">
          <span class="meta-chip">{{ sourceLabel(instrument.sampleSource) }}</span>
          <span v-if="instrument.id === currentInstrumentId" class="meta-chip">当前</span>
          <span v-if="instrument.id === defaultInstrumentId" class="meta-chip">默认</span>
        </div>

        <p class="instrument-description">{{ instrument.description }}</p>
        <div class="instrument-status-text">{{ statusMessage(instrument.id) }}</div>

        <div class="instrument-actions">
          <button
            class="action-btn primary"
            type="button"
            :disabled="instrument.id === currentInstrumentId || isLoading(instrument.id)"
            @click="$emit('activate', instrument.id)"
          >
            {{ instrument.id === currentInstrumentId ? '已在使用' : '立即切换' }}
          </button>
          <button
            class="action-btn secondary"
            type="button"
            :disabled="isLoading(instrument.id)"
            @click="$emit('preload', instrument.id)"
          >
            预加载
          </button>
          <button
            class="action-btn ghost"
            type="button"
            :disabled="instrument.id === defaultInstrumentId"
            @click="$emit('set-default', instrument.id)"
          >
            设为默认
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'InstrumentPanel',
  props: {
    instruments: {
      type: Array,
      default: () => []
    },
    currentInstrumentId: {
      type: String,
      default: ''
    },
    defaultInstrumentId: {
      type: String,
      default: ''
    },
    currentResolvedSource: {
      type: String,
      default: ''
    },
    instrumentStatuses: {
      type: Object,
      default: () => ({})
    }
  },
  computed: {
    currentInstrumentLabel() {
      const instrument = this.instruments.find(item => item.id === this.currentInstrumentId)
      return instrument ? instrument.label : '未就绪'
    },
    defaultInstrumentLabel() {
      const instrument = this.instruments.find(item => item.id === this.defaultInstrumentId)
      return instrument ? instrument.label : '未设置'
    }
  },
  methods: {
    getStatus(instrumentId) {
      return this.instrumentStatuses[instrumentId] || {}
    },
    isLoading(instrumentId) {
      return this.getStatus(instrumentId).state === 'loading'
    },
    statusClass(instrumentId) {
      return this.getStatus(instrumentId).state || 'idle'
    },
    statusLabel(instrumentId) {
      const state = this.getStatus(instrumentId).state || 'idle'
      if (state === 'ready') return '已就绪'
      if (state === 'loading') return '加载中'
      if (state === 'error') return '失败'
      return '未加载'
    },
    statusMessage(instrumentId) {
      const status = this.getStatus(instrumentId)
      return status.message || '尚未加载'
    },
    sourceLabel(source) {
      if (source === 'package') return 'npm 音源'
      if (source === 'soundfont') return 'GeneralUser GS'
      if (source === 'static') return '静态音源'
      if (source === 'local') return '本地采样'
      if (source === 'remote') return '远程音源'
      return '未知来源'
    }
  }
}
</script>
