<script setup lang="ts">
import { ref, watchEffect } from "vue";
// import { useArrayPagination } from "vue-composable";
import { ElButton, ElPagination } from "element-plus";
import "element-plus/es/components/button/style/css";
import "element-plus/es/components/pagination/style/css";

import { DEFAULT_PAGE_SIZE, SIZES } from "../const";

// defineProps<{ msg?: string }>();

console.log(window.electron);

const isLoading = ref(false);
const selectedPath = ref("");
const projects = ref<any[]>([]);
const currentPage = ref(1);
const pageSize = ref(DEFAULT_PAGE_SIZE);
const projectImgs = ref<string[]>([]);

// const {
//   result: projectsPageList,
//   currentPage,
//   // lastPage,
//   // next,
//   // prev,
// } = useArrayPagination(projects, {
//   pageSize,
// });

const getFilePath = (jsonPath: string, file: string) => {
  return jsonPath.substring(0, jsonPath.lastIndexOf("/") + 1) + file;
};

const selectFolder = async () => {
  const res = await window.electron.apis.selectFolder();
  console.log(res);
  if (res.success) {
    selectedPath.value = res.data;
    isLoading.value = true;
    const timePromise = new Promise((resolve) => setTimeout(resolve, 500));
    const jsonsRes = await window.electron.apis.getProjects(res.data);
    if (jsonsRes.success) {
      projects.value = jsonsRes.data;
      currentPage.value = 1;
    }
    // isLoading.value = false;
    timePromise.then(() => {
      isLoading.value = false;
    });
  }
};
const getImg = (project: any) => {
  return window.electron.getImg(getFilePath(project.jsonPath, project.preview));
};
const syncLoadImg = async (_projects: any[]) => {
  for (const [index, project] of _projects.entries()) {
    const base64data = await getImg(project);
    projectImgs.value.splice(index, 1, base64data);
  }
};
const openFile = (project: any) => {
  window.electron.apis.openFile(getFilePath(project.jsonPath, project.file));
};

// watch(projectsPageList, () => {
//   projectImgs.value = new Array(projectsPageList.value.length).fill(undefined);
//   syncLoadImg(projectsPageList.value);
// });
watchEffect(() => {
  window.electron.apis
    .getProjectsByPage("", currentPage.value, pageSize.value)
    .then((list: any) => {
      console.log("list", list);

      projects.value = list;
      projectImgs.value = new Array(list.length).fill(undefined);
      syncLoadImg(list);
    });
});
</script>

<template>
  <div class="folder-line">
    <ElButton :size="'small'" @click="selectFolder">选择文件夹</ElButton>
    <span>path:{{ selectedPath }}</span>
    <span v-loading="isLoading"></span>
  </div>
  <div class="pagination-line">
    <ElPagination
      v-model:currentPage="currentPage"
      v-model:page-size="pageSize"
      :page-sizes="SIZES"
      :total="10000"
      background
      layout="prev, pager, next, total, sizes"
    />
  </div>
  <div class="pic-box">
    <div v-for="(project, index) in projects" :key="index" class="pic-item">
      <img
        class="img"
        :src="projectImgs[index]"
        alt=""
        :style="{ opacity: projectImgs[index] ? 1 : 0 }"
        @click="openFile(project)"
      />
      <p>{{ project.title }}</p>
    </div>
    <div v-for="i in 20" :key="i" class="pic-item" style="margin-top: 0"></div>
  </div>
  <div class="pagination-line">
    <ElPagination
      v-model:currentPage="currentPage"
      v-model:page-size="pageSize"
      :page-sizes="SIZES"
      :total="10000"
      background
      layout="prev, pager, next, total, sizes"
    />
  </div>
</template>

<style scoped lang="less">
.folder-line {
  padding: 20px 20px 0 20px;
  span {
    margin-left: 10px;
  }
}
.pagination-line {
  padding: 20px 20px 0 20px;
  text-align: center;
}
.pic-box {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  padding-right: 20px;
  .pic-item {
    margin: 20px 0 0 20px;
    width: 200px;
    p {
      margin: 0;
    }
  }
  .img {
    height: 200px;
    width: 200px;
    object-fit: contain;
    cursor: pointer;
    transition: opacity 500ms;
  }
}
</style>
