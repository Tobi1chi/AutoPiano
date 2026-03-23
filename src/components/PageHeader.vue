<style lang="less">
@import url('../assets/style/variable.less');
.component-page-header { width: 100%; height: 60px; line-height: 60px; margin: 10px auto; padding: 0 5%;
  .trade-mark { display: block; width: 350px; position: relative; display: flex; justify-content: flex-start; align-items: center; float: left;
    .icon-piano { display: block; transform: scale(0.7); transform-origin: 50% 30%; }
    .trade-mark-txt { font-size: 28px; font-weight: 500; color: #000; margin: 0 0 0 10px;
      .trade-mark-txt--en { font-style: italic; font-size: 20px; color: #666; margin-left: 7px; }
    }
  }
    .menu { float: right; height: 45px; line-height: 45px; margin-top: 5px;
    .menu-item { display: inline-block; width: 80px; margin: 0 7px; text-align: center; position: relative; cursor: pointer;
      &::before { content: ''; width: 100%; height: 1px; position: absolute; left: 0; bottom: 0; transform: scaleX(1); transition: 0.3s; background: #ccc; }
      &::after { content: ''; width: 100%; height: 5px; position: absolute; left: 0; bottom: 0; transform: scaleX(0); transition: 0.3s; background: @c-blue; }
    }
    .menu-item-active::after { transform: scaleX(1); }
    .menu-item:hover::after { transform: scaleX(1); }
  }

  .wallpaper-upload-input {
    display: none;
  }
}
</style>

<template>
  <div class="component-page-header clearfix" ref="PageHeaderComponent">
    <a class="trade-mark" target="_blank" href="http://www.autopiano.cn" >
      <i class="icon-piano"></i>
      <h1 class="trade-mark-txt">自由钢琴<span class="trade-mark-txt--en">AutoPiano.cn</span></h1>
    </a>
    <div class="menu">
      <router-link class="menu-item" :to="{ path: '/' }" active-class="menu-item-active" exact>首页</router-link>
      <router-link class="menu-item" :to="{ path: '/links' }" active-class="menu-item-active" exact>友情链接</router-link>
      <a class="menu-item" @click.stop="openUploadDialog">上传壁纸</a>
      <a class="menu-item" @click.stop="resetWallpaper">默认底色</a>
      <!--<a class="menu-item" >钢琴基础教学</a>-->
    </div>
    <input
      ref="wallpaperInput"
      class="wallpaper-upload-input"
      type="file"
      accept="image/*"
      @change="handleWallpaperSelected"
    >

    <WallpaperCropper
      :visible="cropperVisible"
      :image-src="cropperImageSrc"
      @cancel="closeCropper"
      @apply="applyUploadedWallpaper"
    />
  </div>
</template>

<script>
import { mapActions } from 'vuex'
import WallpaperCropper from '@/components/WallpaperCropper'

export default {
  name: 'PageHeader',
  components: {
    WallpaperCropper
  },
  mixins: [],
  props: [],
  data() {
    return {
      cropperVisible: false,
      cropperImageSrc: ''
    }
  },
  computed: {},
  mounted() {},
  watch: {},
  methods: {
    ...mapActions([
			'$setWallpaper',
      '$resetWallpaper'
		]),
    openUploadDialog() {
      if (this.$refs.wallpaperInput) {
        this.$refs.wallpaperInput.value = ''
        this.$refs.wallpaperInput.click()
      }
    },
    handleWallpaperSelected(event) {
      const file = event.target.files && event.target.files[0]
      if (!file) return

      const reader = new FileReader()
      reader.onload = () => {
        this.cropperImageSrc = reader.result
        this.cropperVisible = true
      }
      reader.readAsDataURL(file)
    },
    closeCropper() {
      this.cropperVisible = false
      this.cropperImageSrc = ''
    },
    applyUploadedWallpaper(croppedImage) {
      this.$setWallpaper({
        type: 'image',
        value: croppedImage
      })
      this.closeCropper()
    },
    resetWallpaper() {
      this.closeCropper()
      this.$resetWallpaper()
    }
  }
}
</script>
