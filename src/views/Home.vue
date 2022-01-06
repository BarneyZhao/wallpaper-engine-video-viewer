<script setup lang="ts">
import { ref, watch } from "vue";
import { ElMessage } from "element-plus";

import { DEFAULT_PAGE_SIZE, SIZES } from "../const";
import { getLocal, setLocal } from "../utils";

// defineProps<{ msg?: string }>();

interface Project {
  project_folder: string;
  file: string;
  preview: string;
  title: string;
}

console.log(window.electron);

const isLoading = ref(false);
const selectedPath = ref(getLocal<string>("SELECTED_PATH") || "");
const projects = ref<Project[]>([]);
const pageTotal = ref(0);
const currentPage = ref(1);
const pageSize = ref(getLocal<number>("PAGE_SIZE") || DEFAULT_PAGE_SIZE);
const projectImgs = ref<string[]>([]);
const dynamicPageSize = ref(getLocal<boolean>("DYNAMIC_PAGE_SIZE") || false);

const getFilePath = (projectFolder: string, file: string) => {
  return `${selectedPath.value + projectFolder}/${file}`;
};
const getImg = (_project: Project) => {
  return window.electron.getImg(
    getFilePath(_project.project_folder, _project.preview)
  );
};
const syncLoadImg = async (_projects: Project[]) => {
  for (const [index, project] of _projects.entries()) {
    const base64data = await getImg(project);
    projectImgs.value.splice(index, 1, base64data);
    // await new Promise((resolve) => setTimeout(resolve, 1000));
  }
};
const openFile = (_project: Project) => {
  window.electron.apis.openFile(
    getFilePath(_project.project_folder, _project.file)
  );
};
const getProjects = async (_path: string, _page: number, _pageSize: number) => {
  if (!_path) return;
  window.electron.apis
    .getProjectsByPage(_path, _page, _pageSize)
    .then((res: any) => {
      console.log("getProjects res", res);
      const list = res.data.list;

      projects.value = list;
      pageTotal.value = res.data.total;
      projectImgs.value = new Array(list.length).fill(undefined);
      syncLoadImg(list);
    });
};
const scanProjects = async (_path: string) => {
  isLoading.value = true;
  const timePromise = new Promise((resolve) => setTimeout(resolve, 500));
  const scanRes = await window.electron.apis.scanProjectsToDb(_path);

  timePromise.then(() => {
    isLoading.value = false;
    console.log("scanRes", scanRes);

    if (scanRes.success) {
      ElMessage({
        message: `成功同步 ${scanRes.data.length} ，新增 ${scanRes.data.newCount} ，清除 ${scanRes.data.invalidCount} 。`,
        type: "success",
        duration: 1500,
      });
      if (currentPage.value === 1) {
        // currentPage 本来就是 1，无法触发 watch，故手动调用
        getProjects(selectedPath.value, 1, pageSize.value);
      }
      currentPage.value = 1;
    } else {
      console.log(scanRes.msg);
      ElMessage({
        message: `发生了错误： ${scanRes.msg}`,
        type: "error",
        duration: 1800,
      });
    }
  });
};

const selectFolder = async () => {
  const res = await window.electron.apis.selectFolder();
  if (res.success && res.data) {
    selectedPath.value = res.data;
    setLocal("SELECTED_PATH", res.data);
    scanProjects(res.data);
  }
};

watch([currentPage, pageSize], ([_currentPage, _pageSize], [, prePageSize]) => {
  if (_pageSize !== prePageSize) {
    setLocal("PAGE_SIZE", _pageSize);
    if (_currentPage !== 1) {
      // pageSize 发生变化时需要重置 currentPage，重置后会触发下一轮 watch
      currentPage.value = 1;
      return;
    }
  }
  getProjects(selectedPath.value, _currentPage, _pageSize);
});

getProjects(selectedPath.value, currentPage.value, pageSize.value);
</script>

<template>
  <div class="folder-line">
    <ElButton :size="'small'" @click="selectFolder">选择文件夹</ElButton>
    <div class="folder-path">
      <span>{{ selectedPath }}</span>
      <span v-loading="isLoading">&nbsp;&nbsp;</span>
    </div>
    <ElButton
      size="small"
      @click="() => scanProjects(selectedPath)"
      v-show="selectedPath"
      >重新同步</ElButton
    >
    <span>&nbsp;&nbsp;</span>
    <ElCheckbox
      size="small"
      v-model="dynamicPageSize"
      label="动态条数"
      border
    />
  </div>
  <div class="pagination-line">
    <ElPagination
      v-model:currentPage="currentPage"
      v-model:page-size="pageSize"
      :page-sizes="SIZES"
      :total="pageTotal"
      background
      layout="prev, pager, next, total, sizes"
    />
  </div>
  <div class="pic-box">
    <div v-for="(project, index) in projects" :key="index" class="pic-item">
      <img
        class="img"
        alt=""
        :class="projectImgs[index] ? 'loaded' : ''"
        :src="projectImgs[index]"
        @click="openFile(project)"
      />
      <p :title="project.title">{{ project.title }}</p>
    </div>
    <div v-for="i in 10" :key="i" class="pic-item" style="margin-top: 0"></div>
  </div>
  <div class="pagination-line">
    <ElPagination
      v-model:currentPage="currentPage"
      v-model:page-size="pageSize"
      :page-sizes="SIZES"
      :total="pageTotal"
      background
      layout="prev, pager, next, total, sizes"
    />
  </div>
</template>

<style scoped lang="less">
.folder-line {
  padding: 20px 20px 0 20px;
  display: flex;
  align-items: center;
  .folder-path {
    flex: 1;
    line-height: 32px;
    margin-left: 10px;
    padding-right: 50px;
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
      min-height: 45px;
      margin: 0;
      word-break: break-all;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
  }
  .img {
    height: 200px;
    width: 200px;
    object-fit: contain;
    cursor: pointer;
    transition: 200ms;
    clip-path: inset(0 200px 200px 0);
    &:hover {
      transform: scale(1.1);
    }
    &.loaded {
      clip-path: inset(0 0 0 0);
    }
  }
}
</style>
