import React, { useState, useEffect } from 'react'
import { useAppState } from '../../store/appStore'
import { useApi } from '../../hooks/useApi'
import { useToast } from '../../hooks/useToast'
import { IPC_CHANNELS } from '../../../shared/constants'
import type { FileNode } from '../../../shared/types'

const EXT_ICON: Record<string, string> = {
  js:'🟨', ts:'🔷', tsx:'⚛️', jsx:'⚛️', py:'🐍',
  html:'🌐', css:'🎨', json:'📋', md:'📝', sql:'🗃️',
  sh:'⚡', png:'🖼️', jpg:'🖼️', svg:'🎭', env:'🔒',
}
const getIcon = (name: string, type: string) => {
  if (type === 'directory') return '📁'
  return EXT_ICON[name.split('.').pop()?.toLowerCase() ?? ''] ?? '📄'
}

function TreeNode({ node, depth, onSelect, onCtx }: {
  node: FileNode, depth: number,
  onSelect: (n: FileNode) => void,
  onCtx: (e: React.MouseEvent, n: FileNode) => void,
}) {
  const [open, setOpen] = useState(false)
  return (
    <div>
      <div
        onClick={() => node.type === 'directory' ? setOpen(!open) : onSelect(node)}
        onContextMenu={e => onCtx(e, node)}
        className="flex items-center gap-1.5 px-2 py-[3px] rounded cursor-pointer
                   text-[13px] text-[#9090b0] hover:bg-surface-500 hover:text-[#e8e8f0]
                   transition-colors mx-1 my-[1px]"
        style={{ paddingLeft: 8 + depth * 14 }}
      >
        {node.type === 'directory'
          ? <span className="text-[9px] text-[#606080] w-3">{open ? '▼' : '▶'}</span>
          : <span className="w-3" />}
        <span className="text-[13px]">{getIcon(node.name, node.type)}</span>
        <span className="flex-1 truncate">{node.name}</span>
        {node.type === 'file' && node.size !== undefined && (
          <span className="text-[10px] text-[#606080] shrink-0">
            {node.size > 1024 ? `${(node.size/1024).toFixed(1)}k` : `${node.size}b`}
          </span>
        )}
      </div>
      {node.type === 'directory' && open && node.children?.map(c => (
        <TreeNode key={c.path} node={c} depth={depth+1} onSelect={onSelect} onCtx={onCtx} />
      ))}
    </div>
  )
}

export default function FilesView() {
  const { state, dispatch } = useAppState()
  const { invoke } = useApi()
  const toast = useToast()
  const [files, setFiles]     = useState<FileNode[]>([])
  const [rootPath, setRoot]   = useState('')
  const [ctxMenu, setCtxMenu] = useState<{x:number;y:number;node:FileNode}|null>(null)

  useEffect(() => {
    const p = state.projects.find(p => p.id === state.activeProjectId)
    if (p) { setRoot(p.path); loadFiles(p.path) }
  }, [state.activeProjectId, state.projects])

  async function loadFiles(dir: string) {
    const res = await invoke(IPC_CHANNELS.FILES_LIST, dir, true)
    if (res.success && res.data) setFiles(res.data as FileNode[])
  }

  function handleSelect(node: FileNode) {
    if (node.type === 'file') {
      dispatch({ type: 'SET_ACTIVE_FILE', payload: node.path })
      dispatch({ type: 'SET_VIEW', payload: 'editor' })
    }
  }

  async function handleDelete(node: FileNode) {
    if (!confirm(`លុប "${node.name}"?`)) return
    const res = await invoke(IPC_CHANNELS.FILES_DELETE, node.path)
    if (res.success) { toast.success('បានលុប'); if (rootPath) loadFiles(rootPath) }
    else toast.error(res.error ?? 'Error')
    setCtxMenu(null)
  }

  return (
    <div className="h-full flex flex-col" onClick={() => setCtxMenu(null)}>
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-3 py-2 bg-surface-800 border-b border-[#2a2a45] shrink-0">
        <span className="text-[13px] font-medium text-[#9090b0]">📁 ឯកសារ</span>
        <span className="flex-1 text-[11px] text-[#606080] truncate">{rootPath || 'គ្មានទីតាំង'}</span>
        <button className="btn btn-ghost btn-sm" onClick={() => rootPath && loadFiles(rootPath)}>🔄</button>
      </div>

      {/* Tree */}
      <div className="flex-1 overflow-y-auto py-2">
        {files.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📁</div>
            <p className="text-[13px]">
              {state.activeProjectId ? 'Project ទទេ' : 'ជ្រើស Project ជាមុន'}
            </p>
          </div>
        ) : (
          files.map(node => (
            <TreeNode key={node.path} node={node} depth={0} onSelect={handleSelect} onCtx={(e, n) => { e.preventDefault(); setCtxMenu({x:e.clientX, y:e.clientY, node:n}) }} />
          ))
        )}
      </div>

      {/* Context menu */}
      {ctxMenu && (
        <div
          className="fixed z-[9998] bg-surface-600 border border-[#2a2a45] rounded-lg p-1.5
                     shadow-card min-w-[140px]"
          style={{ top: ctxMenu.y, left: ctxMenu.x }}
          onClick={e => e.stopPropagation()}
        >
          {ctxMenu.node.type === 'file' && (
            <button className="btn btn-ghost btn-sm w-full justify-start text-[12px]"
              onClick={() => { handleSelect(ctxMenu.node); setCtxMenu(null) }}>
              ✏️ បើក
            </button>
          )}
          <button className="btn btn-ghost btn-sm w-full justify-start text-[12px]"
            onClick={() => handleDelete(ctxMenu.node)}>
            🗑️ លុប
          </button>
          <button className="btn btn-ghost btn-sm w-full justify-start text-[12px]"
            onClick={() => { navigator.clipboard.writeText(ctxMenu.node.path); toast.info('Copy Path'); setCtxMenu(null) }}>
            📋 Copy Path
          </button>
        </div>
      )}
    </div>
  )
}
