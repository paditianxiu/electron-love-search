<script setup lang="ts">
import 'mdui/mdui.css';
import 'mdui';
import 'mdui/components/icon.js';
import { ref, onMounted, reactive } from 'vue';
import axios from 'axios';

interface Movie {
  title: string | null | undefined;
  rating: string | null | undefined;
  cover: string | undefined;
}

const recommendResult = ref()
const top250Result = ref<Movie[]>([])
const laterResult = ref<Movie[]>([])
const searchDialog = ref()
const searchScore = ref()
const currentUrl = ref()
const getData = ref()
const keyword = ref("")

import Hls from 'hls.js';
import Artplayer from 'artplayer';

var art: any;
onMounted(() => {
  axios.get('https://movie.douban.com/j/search_subjects?&type=movie&sort=recommend&tag=%E7%83%AD%E9%97%A8&page_limit=41&page_start=1')
    .then(response => {
      recommendResult.value = response.data.subjects;
    })
    .catch(error => {
      console.error('Error:', error);
    });

  axios.get('https://gitee.com/padi/padi/raw/master/lovesearch.json')
    .then(response => {
      searchScore.value = response.data;
      currentUrl.value = response.data[0].url
    })
    .catch(error => {
      console.error('Error:', error);
    });

  axios.get('https://movie.douban.com/top250')
    .then(response => {
      var parser = new DOMParser();
      var doc = parser.parseFromString(response.data, 'text/html');
      var itemList = doc.querySelectorAll('.grid_view .item');
      for (var item of itemList) {
        var title = item.querySelector('.info .hd span')?.textContent;
        var rating = item.querySelector('.info .bd .star .rating_num')?.textContent;
        var imgUrl = item.querySelector('.pic img')?.attributes.getNamedItem('src')?.value;
        top250Result.value.push({
          title: title,
          rating: rating,
          cover: imgUrl
        })
      }
    })
    .catch(error => {
      console.error('Error:', error);
    });

  axios.get('https://movie.douban.com/cinema/later/')
    .then(response => {
      var parser = new DOMParser();
      var doc = parser.parseFromString(response.data, 'text/html');
      var itemList = doc.querySelectorAll('.item');
      for (var item of itemList) {
        var title = item.querySelector("h3")
          ?.textContent?.replace("\n", "")
          .replace(" ", "");;
        var rating = item.querySelector('.dt')?.textContent;
        var imgUrl = item.querySelector('img')?.attributes.getNamedItem('src')?.value;
        laterResult.value.push({
          title: title,
          rating: rating,
          cover: imgUrl
        })
      }
    })
    .catch(error => {
      console.error('Error:', error);
    });

  function playM3u8(video: any, url: any, art: any) {
    if (Hls.isSupported()) {
      if (art.hls) art.hls.destroy();
      const hls = new Hls();
      hls.loadSource(url);
      hls.attachMedia(video);
      art.hls = hls;
      art.on('destroy', () => hls.destroy());
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = url;
    } else {
      art.notice.show = 'Unsupported playback format: m3u8';
    }
  }

  art = new Artplayer({
    container: '.artplayer-app',
    url: '',
    type: 'm3u8',
    fullscreen: true,
    hotkey: true,
    autoplay: true,
    muted: true,
    customType: {
      m3u8: playM3u8,
    },
  });

  art.url = "https://cdn.wlcdn99.com:777/66c10c4e/index.m3u8",

    art.on('ready', () => {

    });



})

interface PlayerUrl {
  url: string[];
  name: string;
  sub: string;
}

const playerUrlList = reactive<PlayerUrl[]>([])

function searchFun() {
  var searchUrl = `${currentUrl.value}?ac=detail&wd=${keyword.value}`
  console.log(searchUrl);
  axios.get(searchUrl)
    .then(response => {
      getData.value = response.data.list;
      playerUrlList.splice(0, playerUrlList.length);
      console.log(response.data.list);
      response.data.list.forEach((element: {
        vod_blurb: any;
        vod_name: any; vod_play_url: any;
      }) => {
        var vod_play_url = element.vod_play_url + "#"
        var urls;
        if (vod_play_url.indexOf("$$$") != -1) {
          urls = vod_play_url.split("$$$")[1].split("#");;
        } else {
          urls = vod_play_url.split("#");
        }
        playerUrlList.push({
          url: urls,
          name: element.vod_name,
          sub: element.vod_blurb
        })
      });

    })
    .catch(error => {
      console.error('Error:', error);
    });
}

const currentTabIndex = ref("")
setTimeout(() => {
  currentTabIndex.value = "tab0"
}, 500)

function switchTab(item: { url: any; }, index: number) {
  currentTabIndex.value = 'tab' + index;
  currentUrl.value = item.url

}

interface FilmUrl {
  url: string;
  name: string;
}

const playerDialog = ref()
const filmName = ref()
const filmSub = ref()
const currentIndex = ref(0)
var filmUrl = reactive<FilmUrl[]>([])

function gotoPlayer(item: { url: any; name: any; sub: any; }) {
  filmName.value = item.name
  filmSub.value = item.sub
  filmUrl.splice(0, filmUrl.length);
  item.url.forEach((element: string) => filmUrl.push({
    name: element.split("$")[0],
    url: element.split("$")[1],
  }));
  currentIndex.value = 0
  art.url = filmUrl[0].url
  playerDialog.value.open = true
  filmUrl = filmUrl.filter(film => film.url !== undefined);

}

function closePlayer() {
  playerDialog.value.open = false
  art.pause();
}
function selectUrl(index: number) {
  art.url = filmUrl[index].url
  currentIndex.value = index
}

function isActive(index: number) {
  return currentIndex.value === index;
}

</script>

<template>
  <el-col>
    <div class="fixed-top">
      <mdui-top-app-bar scroll-behavior="elevate" style="position: relative;">
        <mdui-dropdown>
          <mdui-button slot="trigger" variant="text" icon="near_me">菜单</mdui-button>
          <mdui-menu>
            <mdui-menu-item><mdui-icon slot="icon" name="smart_toy"></mdui-icon>联系作者</mdui-menu-item>
            <mdui-menu-item><mdui-icon slot="icon" name="groups"></mdui-icon>交流群</mdui-menu-item>
            <mdui-menu-item><mdui-icon slot="icon" name="card_giftcard"></mdui-icon>免责声明</mdui-menu-item>
          </mdui-menu>
        </mdui-dropdown>
        <mdui-top-app-bar-title>爱搜片</mdui-top-app-bar-title>
        <div style="flex-grow: 1"></div>
        <mdui-tooltip content="收藏">
          <mdui-button variant="text" icon="favorite_border">收藏</mdui-button>
        </mdui-tooltip>
        <mdui-tooltip content="历史记录">
          <mdui-button variant="text" icon="history">历史记录</mdui-button>
        </mdui-tooltip>
        <mdui-tooltip content="搜索">
          <mdui-button variant="text" icon="search" @click="searchDialog.open = true">搜索</mdui-button>
        </mdui-tooltip>
      </mdui-top-app-bar>
    </div>

    <mdui-dialog fullscreen close-on-esc close-on-overlay-click ref="searchDialog">
      <el-row class="fixed-top"
        style="display: flex;justify-items: center;align-items: center;background-color: #ece6f0;padding-bottom: 16px;">
        <mdui-button-icon icon="keyboard_arrow_down" @click="searchDialog.open = false"></mdui-button-icon>
        <mdui-text-field v-model="keyword" style="flex: 1;margin-left: 8px;margin-right: 8px;"
          label="输入搜索的关键词"></mdui-text-field>
        <mdui-button icon="search" @click="searchFun()">搜索</mdui-button>
      </el-row>
      <div style="display: flex;flex-direction: row;">
        <mdui-tabs placement="left-start" :value="currentTabIndex">
          <mdui-tab v-for="(item, index) in searchScore" @click="switchTab(item, index)" :value="'tab' + index">{{
            item.name
          }}</mdui-tab>
        </mdui-tabs>
        <div class="grid" style="margin-top: 16px;flex: 1;align-items: flex-start;">
          <mdui-card v-for="(item, index) in getData" class="card" @click="gotoPlayer(playerUrlList[index])">
            <div>
              <img referrerpolicy="no-referrer" style="width: 100%;height: 320px; object-fit: cover;"
                :src="item.vod_pic" alt="">
              <p style="padding-left: 1em; white-space: nowrap;overflow: hidden;text-overflow: ellipsis;">{{
                item.vod_name
                }}
              </p>
              <div class="time-float-control" style="position: absolute; top: 10px;">
                <p class="rating">{{ item.type_name }}</p>
              </div>
            </div>
          </mdui-card>
        </div>
      </div>
    </mdui-dialog>

    <mdui-dialog fullscreen ref="playerDialog">
      <div style="width: 100%;display: flex; justify-content: flex-end;">
        <mdui-button variant="text" icon="close" @click="closePlayer()">关闭</mdui-button>
      </div>
      <div style="width: 100%;height: 100%;display: flex;flex-direction: row;">
        <div class="artplayer-app" style="width:600px;height: 80vh;"></div>
        <div style="margin: 16px;flex: 1;">
          <h3>{{ filmName }}</h3>
          <h4 style="color: grey; max-height: 3em; line-height: 1.5em; overflow: hidden; text-overflow: ellipsis;">
            {{ filmSub }}
          </h4>
          <mdui-divider></mdui-divider>
          <div
            style="width: 100%; height: 55vh; background-color: white; border-radius: 18px; overflow: hidden;overflow-y: auto;">
            <mdui-list style="max-height: 50vh;">
              <mdui-list-subheader>选集({{ currentIndex + 1 }}/{{ filmUrl.length }})</mdui-list-subheader>
              <mdui-list-item :active="isActive(index)" v-for="(item, index) in filmUrl" :key="index"
                @click="selectUrl(index)">{{
                  item.name }}</mdui-list-item>
            </mdui-list>
          </div>

        </div>
      </div>


    </mdui-dialog>

    <mdui-tabs value="tab-1" placement="top">
      <mdui-tab value="tab-1" inline icon="whatshot">热门推荐</mdui-tab>
      <mdui-tab value="tab-2" inline icon="bookmark_border">豆瓣排行</mdui-tab>
      <mdui-tab value="tab-3" inline icon="calendar_month">即将上映</mdui-tab>
      <mdui-tab-panel slot="panel" value="tab-1">
        <div class="grid" style="margin-top: 16px;">
          <mdui-card v-for="(item, _) in recommendResult" class="card">
            <div>
              <img referrerpolicy="no-referrer" style="width: 100%;height: 100%;" :src="item.cover" alt="">
              <p style="padding-left: 1em; white-space: nowrap;overflow: hidden;text-overflow: ellipsis;">{{ item.title
                }}
              </p>
              <div class="time-float-control" style="position: absolute; top: 10px;">
                <p class="rating">评分:{{ item.rate }}</p>
              </div>
            </div>
          </mdui-card>
        </div>
      </mdui-tab-panel>
      <mdui-tab-panel slot="panel" value="tab-2">
        <div class="grid" style="margin-top: 16px;">
          <mdui-card v-for="(item, _) in top250Result" class="card">
            <div>
              <img referrerpolicy="no-referrer" style="width: 100%;height: 100%;" :src="item.cover" alt="">
              <p style="padding-left: 1em; white-space: nowrap;overflow: hidden;text-overflow: ellipsis;">{{ item.title
                }}
              </p>
            </div>
            <div class="time-float-control" style="position: absolute; top: 10px;">
              <p class="rating">评分:{{ item.rating }}</p>
            </div>
          </mdui-card>
        </div>
      </mdui-tab-panel>
      <mdui-tab-panel slot="panel" value="tab-3">
        <div class="grid" style="margin-top: 16px;">
          <mdui-card v-for="(item, _) in laterResult" class="card">
            <div>
              <img referrerpolicy="no-referrer" style="width: 100%;height: 100%;" :src="item.cover" alt="">
              <p style="padding-left: 1em; white-space: nowrap;overflow: hidden;text-overflow: ellipsis;">{{ item.title
                }}
              </p>
            </div>
            <div class="time-float-control" style="position: absolute; top: 10px;">
              <p class="rating">{{ item.rating }}</p>
            </div>
          </mdui-card>
        </div>
      </mdui-tab-panel>
    </mdui-tabs>
  </el-col>
</template>

<style scoped>
.fixed-top {
  position: sticky;
  top: 0;
  z-index: 1000;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, 210px);
  gap: 24px;
  align-items: center;
  justify-content: center;
}

.rating {
  padding: 4px;
  color: white;
  border-radius: 0 999px 999px 0;
  background-color: rgba(255, 255, 255, 0.5)
}


.card {
  width: 100%;
  /* padding: 1.0em; */
  will-change: filter;
  transition: filter 300ms;
}

.card:hover {
  filter: drop-shadow(0 0 2em #646cffaa);
}

.logo.vue:hover {
  filter: drop-shadow(0 0 2em #42b883aa);
}

/* 隐藏滚动条 */
::-webkit-scrollbar {
  display: none !important;
  /* 对于WebKit浏览器（如Chrome、Safari） */
}

/* 隐藏滚动条，但允许滚动 */
body {
  -ms-overflow-style: none;
  /* IE和Edge */
  scrollbar-width: none;
  /* Firefox */
}
</style>
