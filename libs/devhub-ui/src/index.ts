/**
 * DevHub 공용 UI. 저장소마다 있는 DevHub 앱(shared-stack · snapdone)이 같은 셸 · 그림 · 문서 화면을
 * 쓰기 위한 것이다. 카탈로그(무엇을 보여 줄지)는 앱이 갖고, 여기는 어떻게 보여 줄지만 있다.
 * 라우터는 `DevHubProvider` 로 주입한다 — Next 와 react-router 가 같은 컴포넌트를 쓴다.
 */
export { type CanvasEdge, CanvasEdges } from './canvas/canvas-edges';
export { CanvasViewport, type LegendItem, openModal } from './canvas/canvas-viewport';
export { usePanZoom } from './canvas/use-pan-zoom';
export { ViewSwitch } from './canvas/view-switch';
export {
  clampZoom,
  fitView,
  MAX_ZOOM,
  MIN_ZOOM,
  panBy,
  type Rect,
  revealRect,
  type Size,
  type View,
  zoomAt,
} from './canvas/viewport';
export { CopyButton } from './doc/copy-button';
export { DocContent, type RenderLink } from './doc/doc-content';
export { DocToc } from './doc/doc-toc';
export { DocumentLayout } from './doc/document-layout';
export { Empty, InspectorSection } from './entity/inspector-section';
export { Pager, type PagerItem } from './entity/pager';
export { RecordMeta } from './entity/record-meta';
export { type Inline, inlineText, parseInline } from './markdown/inline';
export { anchorsOf, bodyOf, type OutlineItem, outlineOf } from './markdown/outline';
export { type Block, type ListItem, parseMarkdown } from './markdown/parse';
export { slug } from './markdown/slug';
export {
  type DevHubConfig,
  type DevHubLinkProps,
  type DevHubLocation,
  DevHubProvider,
  type DevHubRouter,
  isCurrentPath,
  useDevHub,
  useDevHubLink,
  useDevHubLocation,
  useDevHubNavigate,
} from './provider/devhub-provider';
export {
  GlobalSearch,
  type GlobalSearchProps,
  type SearchSuggestion,
} from './search/global-search';
export {
  buildIndex,
  search,
  type SearchEntry,
  type SearchIndex,
  type SearchResult,
  tierOf,
  TIERS,
  topResults,
} from './search/rank';
export { isMac, isSearchShortcut, resultStatus, shortcutOf } from './search/shortcut';
export { basename, normalize, stem, tokensOf } from './search/text';
export { DevHubShell } from './shell/devhub-shell';
export {
  Explorer,
  type ExplorerGroup,
  type ExplorerItem,
  type ExplorerSection,
  type ExplorerView,
} from './shell/explorer';
export { ExplorerDrawerProvider, ExplorerPane, ExplorerToggle } from './shell/explorer-drawer';
export { Inspector } from './shell/inspector';
export { TopBar, type TopBarView } from './shell/top-bar';
export { useDocumentTitle } from './shell/use-document-title';
export { useRouteFocus } from './shell/use-route-focus';
export {
  INSPECTOR_ID,
  MAIN_CONTENT_ID,
  WorkspaceFrame,
  WorkspaceHeader,
  WorkspaceSection,
} from './shell/workspace';
export {
  applyTheme,
  currentTheme,
  subscribeTheme,
  THEME_KEY,
  type ThemeMode,
  themeScript,
} from './theme/theme';
export { ThemeSwitch } from './theme/theme-switch';
export { Icon, type IconName } from './ui/icon';
