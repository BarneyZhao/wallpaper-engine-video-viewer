<script setup lang="ts">
import { ref, watch } from "vue";
import {
  CirclePlus,
  CircleCheck,
  Refresh,
  Sort,
  Search,
} from "@element-plus/icons-vue";
import { ElMessage } from "element-plus";
import "element-plus/es/components/message/style/css";

import { DEFAULT_PAGE_SIZE, SIZES } from "../const";
import { getLocal, setLocal, getSizeDesc } from "../utils";
import {
  SELECTED_PATH,
  SELECTED_COPY_PATH,
  SYNC_INFO,
  PAGE_SIZE,
  ORDER_BY,
  ORDER_TYPE,
  CHECK_REPEAT,
} from "../storageKey";
import { apis, getImg, Project } from "../services";

// defineProps<{ msg?: string }>();

const isLoading = ref(false);
const selectedPath = ref(getLocal<string>(SELECTED_PATH) || "");
const selectedCopyPath = ref(getLocal<string>(SELECTED_COPY_PATH) || "");
const syncInfo = ref(
  getLocal<{ syncWhenInit: boolean; timestamp: string }>(SYNC_INFO) || {
    syncWhenInit: false,
    timestamp: "",
  }
);
const projects = ref<Project[]>([]);
const projectTotal = ref(0);
const currentPage = ref(1);
const pageSize = ref(getLocal<number>(PAGE_SIZE) || DEFAULT_PAGE_SIZE);
const projectImgs = ref<string[]>([]);
const orderBy = ref(getLocal<string>(ORDER_BY) || "create_time"); // file_size
const orderType = ref(getLocal<string>(ORDER_TYPE) || "DESC"); // ASC
const inputTitle = ref("");
const queryTitle = ref("");
const checkRepeat = ref(getLocal<boolean>(CHECK_REPEAT) || false);
// const dynamicPageSize = ref(getLocal<boolean>("DYNAMIC_PAGE_SIZE") || false);

const getFilePath = (projectFolder: string, file: string) => {
  return `${selectedPath.value}/${projectFolder}/${file}`;
};

const syncLoadImg = async (_projects: Project[]) => {
  for (const [index, { project_folder, preview }] of _projects.entries()) {
    const base64data = await getImg(getFilePath(project_folder, preview));
    projectImgs.value.splice(index, 1, base64data);
    // await new Promise((resolve) => setTimeout(resolve, 1000));
  }
};

const getProjects = async (_page: number) => {
  if (!selectedPath.value) return;
  window.scrollTo(0, 0);
  const res = await apis.getProjectsByPage({
    folderPath: selectedPath.value,
    orderBy: orderBy.value,
    orderType: orderType.value,
    pageNo: _page,
    pageSize: pageSize.value,
    title: queryTitle.value,
    checkRepeat: checkRepeat.value,
  });
  if (res.success && res.data) {
    const list = res.data.list;

    projects.value = list;
    projectTotal.value = res.data.total;
    projectImgs.value = new Array(list.length).fill(undefined);
    syncLoadImg(list);
  }
};

const scanProjects = async (_path: string) => {
  isLoading.value = true;
  const timePromise = new Promise((resolve) => setTimeout(resolve, 500));
  const scanRes = await apis.scanProjectsToDb(_path);

  timePromise.then(() => {
    isLoading.value = false;
    if (scanRes.success && scanRes.data) {
      syncInfo.value.timestamp = scanRes.data.timestamp;
      const message = `成功同步 ${scanRes.data.length} ，新增 ${scanRes.data.newCount} ，清除 ${scanRes.data.invalidCount} 。`;
      ElMessage({
        showClose: true,
        message,
        type: "success",
        duration: 3000,
      });
      console.log(message);
      if (currentPage.value === 1) {
        // currentPage 本来就是 1，无法触发 watch，故手动调用
        getProjects(1);
      }
      currentPage.value = 1;
    }
  });
};

const selectFolderPath = async () => {
  isLoading.value = true;
  const res = await apis.selectFolder();
  if (res.success && res.data) {
    selectedPath.value = res.data;
    setLocal(SELECTED_PATH, res.data);
    scanProjects(res.data);
  } else {
    isLoading.value = false;
  }
};

const orderTypeChange = () => {
  orderType.value = orderType.value === "ASC" ? "DESC" : "ASC";
};

const picItemClick = ({ project_folder, file }: Project) => {
  apis.openFile(getFilePath(project_folder, file));
};

const contextmenuClick = async ({ project_folder, file }: Project) => {
  const res = await apis
    .showContextmenus(getFilePath(project_folder, file), selectedCopyPath.value)
    .catch(console.error);
  if (res?.success && res.data?.act === "copied") {
    selectedCopyPath.value = res.data.path || "";
    setLocal("SELECTED_COPY_PATH", res.data.path);
    ElMessage({
      showClose: true,
      message: "复制完成",
      type: "success",
      duration: 10000,
    });
  }
};

document.addEventListener("keydown", (e) => {
  if (["ArrowLeft" /**, "KeyA" */].includes(e.code)) {
    // prev
    if (currentPage.value > 1) currentPage.value -= 1;
  } else if (["ArrowRight" /**, "KeyD" */].includes(e.code)) {
    // next
    if (currentPage.value < Math.ceil(projectTotal.value / pageSize.value)) {
      currentPage.value += 1;
    }
  }
});

watch(
  [pageSize, orderBy, orderType, checkRepeat, queryTitle],
  (
    [_pageSize, _orderBy, _orderType, _checkRepeat],
    [prePageSize, preOrderBy, preOrderType, preCheckRepeat]
  ) => {
    if (_pageSize !== prePageSize) {
      setLocal(PAGE_SIZE, _pageSize);
    }
    if (_orderBy !== preOrderBy) {
      setLocal(ORDER_BY, _orderBy);
    }
    if (_orderType !== preOrderType) {
      setLocal(ORDER_TYPE, _orderType);
    }
    if (_checkRepeat !== preCheckRepeat) {
      setLocal(CHECK_REPEAT, _checkRepeat);
    }
    if (currentPage.value !== 1) {
      // 监听字段发生变化时需要重置 currentPage，重置后会触发 currentPage watch
      currentPage.value = 1;
      return;
    }
    getProjects(currentPage.value);
  }
);

watch([currentPage], ([_currentPage]) => {
  getProjects(_currentPage);
});
watch([syncInfo], ([_syncInfo]) => {
  setLocal(SYNC_INFO, _syncInfo);
});

// 初始化查询
if (selectedPath.value && syncInfo.value.syncWhenInit) {
  scanProjects(selectedPath.value);
} else {
  getProjects(currentPage.value);
}
</script>

<template>
  <div class="folder-line">
    <ElTooltip
      placement="bottom"
      :content="selectedPath"
      :disabled="!selectedPath"
    >
      <ElButton @click="selectFolderPath" :loading="isLoading">
        <ElIcon v-show="!isLoading" style="margin-right: 6px">
          <CirclePlus v-show="!selectedPath" />
          <CircleCheck v-show="selectedPath" color="#67C23A" />
        </ElIcon>
        <slot>选择文件夹</slot>
      </ElButton>
    </ElTooltip>
    <template v-if="selectedPath">
      <ElTooltip
        placement="bottom"
        :content="`上次同步: ${syncInfo.timestamp}`"
        :disabled="!syncInfo.timestamp"
      >
        <ElButton
          @click="() => scanProjects(selectedPath)"
          :icon="Refresh"
          :loading="isLoading"
        >
          重新同步
        </ElButton></ElTooltip
      >
      <ElCheckbox
        v-model="syncInfo.syncWhenInit"
        label="启动时自动同步"
        style="margin: 0 0 0 12px"
      ></ElCheckbox>
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
      <ElInput
        v-model="inputTitle"
        placeholder="输入名称搜索"
        style="margin-left: 12px; width: 200px"
      >
        <template #append>
          <ElButton :icon="Search" @click="queryTitle = inputTitle" />
        </template>
      </ElInput>
      <ElCheckbox
        v-model="checkRepeat"
        label="查重模式"
        border
        style="margin-left: 12px"
      />
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
      layout="total, sizes, prev, pager, next"
    />
  </div>
  <ElEmpty v-if="projects.length === 0" description="什么都没有~" />
  <div class="pic-box">
    <div v-for="(project, index) in projects" :key="index" class="pic-item">
      <img
        class="img"
        alt=""
        :src="projectImgs[index]"
        @click="picItemClick(project)"
        @contextmenu="contextmenuClick(project)"
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
      layout="total, sizes, prev, pager, next"
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
  .el-pagination {
    justify-content: center;
  }
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
