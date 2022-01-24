<script setup lang="ts">
import { ref, watch } from "vue";
import {
  CirclePlus,
  CircleCheck,
  Refresh,
  Sort,
} from "@element-plus/icons-vue";
import { ElMessage } from "element-plus";
import "element-plus/es/components/message/style/css";

import { DEFAULT_PAGE_SIZE, SIZES } from "../const";
import { getLocal, setLocal, getSizeDesc } from "../utils";

// defineProps<{ msg?: string }>();

interface Project {
  project_folder: string;
  file: string;
  file_size: number;
  preview: string;
  title: string;
}

console.log(window.electron);

const isLoading = ref(false);
const selectedPath = ref(getLocal<string>("SELECTED_PATH") || "");
const projects = ref<Project[]>([]);
const projectTotal = ref(0);
const currentPage = ref(1);
const pageSize = ref(getLocal<number>("PAGE_SIZE") || DEFAULT_PAGE_SIZE);
const projectImgs = ref<string[]>([]);
const orderBy = ref(getLocal<string>("ORDER_BY") || "create_time"); // file_size
const orderType = ref(getLocal<string>("ORDER_TYPE") || "DESC"); // ASC
// const dynamicPageSize = ref(getLocal<boolean>("DYNAMIC_PAGE_SIZE") || false);

const getFilePath = (projectFolder: string, file: string) => {
  return `${selectedPath.value}/${projectFolder}/${file}`;
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
const openFileFolder = (_project: Project) => {
  window.electron.apis.openFileFolder(
    `${selectedPath.value}/${_project.project_folder}`
  );
};
const getProjects = async (_page: number, _pageSize: number) => {
  if (!selectedPath.value) return;
  window.electron.apis
    .getProjectsByPage(
      selectedPath.value,
      orderBy.value,
      orderType.value,
      _page,
      _pageSize
    )
    .then((res: any) => {
      console.log("getProjects res", res);
      const list = res.data.list;

      projects.value = list;
      projectTotal.value = res.data.total;
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
        showClose: true,
        message: `成功同步 ${scanRes.data.length} ，新增 ${scanRes.data.newCount} ，清除 ${scanRes.data.invalidCount} 。`,
        type: "success",
        duration: 2500,
      });
      if (currentPage.value === 1) {
        // currentPage 本来就是 1，无法触发 watch，故手动调用
        getProjects(1, pageSize.value);
      }
      currentPage.value = 1;
    } else {
      console.log(scanRes.msg);
      ElMessage({
        showClose: true,
        message: `发生了错误： ${scanRes.msg}`,
        type: "error",
        duration: 2500,
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

const orderTypeChange = () => {
  orderType.value = orderType.value === "ASC" ? "DESC" : "ASC";
};

document.addEventListener("keydown", (e) => {
  if (["ArrowLeft", "KeyA"].includes(e.code)) {
    // prev
    if (currentPage.value > 1) currentPage.value -= 1;
  } else if (["ArrowRight", "KeyD"].includes(e.code)) {
    // next
    if (currentPage.value < Math.ceil(projectTotal.value / pageSize.value)) {
      currentPage.value += 1;
    }
  }
});

watch([currentPage, pageSize], ([_currentPage, _pageSize], [, prePageSize]) => {
  if (_pageSize !== prePageSize) {
    setLocal("PAGE_SIZE", _pageSize);
    if (_currentPage !== 1) {
      // pageSize 发生变化时需要重置 currentPage，重置后会触发下一轮 watch
      currentPage.value = 1;
      return;
    }
  }
  getProjects(_currentPage, _pageSize);
});

watch([orderBy, orderType], ([_orderBy, _orderType]) => {
  setLocal("ORDER_BY", _orderBy);
  setLocal("ORDER_TYPE", _orderType);
  getProjects(currentPage.value, pageSize.value);
});

getProjects(currentPage.value, pageSize.value);
</script>

<template>
  <div class="folder-line">
    <ElTooltip
      placement="bottom"
      :content="selectedPath"
      :disabled="!selectedPath"
    >
      <ElButton @click="selectFolder" :loading="isLoading">
        <ElIcon v-show="!isLoading" style="margin-right: 6px">
          <CirclePlus v-show="!selectedPath" />
          <CircleCheck v-show="selectedPath" color="#67C23A" />
        </ElIcon>
        <slot>选择文件夹</slot>
      </ElButton>
    </ElTooltip>
    <template v-if="selectedPath">
      <ElButton
        @click="() => scanProjects(selectedPath)"
        :icon="Refresh"
        :loading="isLoading"
      >
        重新同步
      </ElButton>
      <span class="order-explain">根据</span>
      <ElSelect
        v-model="orderBy"
        :loading="isLoading"
        style="margin-left: 12px; width: 120px"
      >
        <ElOption label="创建时间" value="create_time" />
        <ElOption label="文件大小" value="file_size" />
      </ElSelect>
      <ElButton
        @click="orderTypeChange"
        :icon="Sort"
        :loading="isLoading"
        style="margin-left: 12px"
      >
        {{ orderType === "DESC" ? "降序" : "升序" }}
      </ElButton>
      <!-- <ElCheckbox v-model="dynamicPageSize" label="动态条数" border /> -->
    </template>
  </div>
  <div class="pagination-line">
    <ElPagination
      v-model:currentPage="currentPage"
      v-model:page-size="pageSize"
      :page-sizes="SIZES"
      :total="projectTotal"
      background
      layout="prev, pager, next, total, sizes"
    />
  </div>
  <div class="pic-box">
    <div v-for="(project, index) in projects" :key="index" class="pic-item">
      <img
        class="img"
        alt=""
        :src="projectImgs[index]"
        @click="openFile(project)"
        @contextmenu="openFileFolder(project)"
      />
      <p :title="project.title">
        [{{ getSizeDesc(project.file_size) }}]&nbsp;{{ project.title }}
      </p>
    </div>
    <div v-for="i in 10" :key="i" class="pic-item" style="margin-top: 0"></div>
  </div>
  <div class="pagination-line">
    <ElPagination
      v-model:currentPage="currentPage"
      v-model:page-size="pageSize"
      :page-sizes="SIZES"
      :total="projectTotal"
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
  .order-explain {
    font-size: 14px;
    margin-left: 20px;
    position: relative;
    &::before {
      content: "";
      position: absolute;
      left: -8px;
      top: 0;
      height: 20px;
      width: 2px;
      background-color: #dcdfe6;
    }
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
      height: 44px;
      line-height: 22px;
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
    display: inline-block;
    transform: scale(1);
    transition: transform 200ms;
    &:hover {
      transform: scale(1.05);
    }
    &:before {
      content: "";
      position: absolute;
      left: 0;
      top: 0;
      width: 100%;
      height: 100%;
      background: #f5f5f5 no-repeat center / 50% 50%;
    }
  }
}
</style>
