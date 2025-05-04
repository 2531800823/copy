import { Toast } from '@douyinfe/semi-ui'

/**
 * 导出JSON文件
 * @param exportData 导出的数据
 */
export function handleExportJSON(exportData: any) {
  try {
    // 转换为JSON字符串
    const jsonString = JSON.stringify(exportData, null, 2)

    // 创建Blob对象
    const blob = new Blob([jsonString], { type: 'application/json' })

    // 创建下载链接
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `copy-data-${new Date().toISOString().split('T')[0]}.json`

    // 触发下载
    document.body.appendChild(a)
    a.click()

    // 清理
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    Toast.success('导出成功')
  }
  catch (error) {
    console.error('导出失败:', error)
    Toast.error('导出失败')
  }
}
