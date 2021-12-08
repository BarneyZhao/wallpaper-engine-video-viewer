<script setup lang="ts">
import { ref, watch } from "vue";
import { useArrayPagination } from "vue-composable";
import { ElButton, ElPagination } from "element-plus";
import "element-plus/es/components/button/style/css";
import "element-plus/es/components/pagination/style/css";

import { DEFAULT_PAGE_SIZE, SIZES } from "../const";

// defineProps<{ msg?: string }>();

console.log(window.electron);

const isLoading = ref(false);
const selectedPath = ref("");
const projects = ref<any[]>([]);
const pageSize = ref(DEFAULT_PAGE_SIZE);
const projectImgs = ref<string[]>([]);

const {
  result: projectsPageList,
  currentPage,
  // lastPage,
  // next,
  // prev,
} = useArrayPagination(projects, {
  pageSize,
});

const getFilePath = (jsonPath: string, file: string) => {
  return (
    selectedPath.value +
    jsonPath.substring(0, jsonPath.lastIndexOf("/") + 1) +
    file
  );
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
  return window.electron.getImg(
    getFilePath(project.relativeJsonPath, project.preview)
  );
};
const syncLoadImg = async (_projects: any[]) => {
  for (const [index, project] of _projects.entries()) {
    const base64data = await getImg(project);
    projectImgs.value.splice(index, 1, base64data);
  }
};
const openFile = (project: any) => {
  window.electron.apis.openFile(
    getFilePath(project.relativeJsonPath, project.file)
  );
};

watch(projectsPageList, () => {
  projectImgs.value = new Array(projectsPageList.value.length).fill(undefined);
  syncLoadImg(projectsPageList.value);
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
      :total="projects.length"
      background
      layout="prev, pager, next, total, sizes"
    />
  </div>
  <div class="pic-box">
    <div
      v-for="(project, index) in projectsPageList"
      :key="index"
      class="pic-item"
    >
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
      :total="projects.length"
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
