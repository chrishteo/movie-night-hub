export default function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmStyle = 'danger', // 'danger' or 'primary'
  onConfirm,
  onCancel,
  darkMode
}) {
  if (!isOpen) return null

  const card = darkMode ? 'bg-gray-800' : 'bg-white'
  const confirmBg = confirmStyle === 'danger'
    ? 'bg-red-600 hover:bg-red-700'
    : confirmStyle === 'warning'
    ? 'bg-amber-600 hover:bg-amber-700'
    : 'bg-purple-600 hover:bg-purple-700'

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 modal-backdrop">
      <div className={`${card} rounded-lg p-6 w-full max-w-sm modal-content`}>
        <h3 className="text-lg font-bold mb-2">{title}</h3>
        <p className="opacity-70 mb-6">{message}</p>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 rounded bg-gray-600 hover:bg-gray-500 transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 px-4 py-2 rounded text-white ${confirmBg} transition-colors`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}
