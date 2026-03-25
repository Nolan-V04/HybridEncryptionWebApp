import { useRef } from "react";

function FileDropZone({
  id,
  label,
  file,
  accept,
  onFileSelect,
}) {
  const inputRef = useRef(null);

  function handleFiles(fileList) {
    if (!fileList || !fileList.length) {
      return;
    }

    onFileSelect(fileList[0]);
  }

  function onDrop(event) {
    event.preventDefault();
    event.stopPropagation();
    handleFiles(event.dataTransfer.files);
  }

  function onDragOver(event) {
    event.preventDefault();
  }

  return (
    <div
      className="drop-zone"
      onDrop={onDrop}
      onDragOver={onDragOver}
      onClick={() => inputRef.current?.click()}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          inputRef.current?.click();
        }
      }}
    >
      <input
        id={id}
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={(event) => handleFiles(event.target.files)}
        hidden
      />
      <p className="drop-title">{label}</p>
      <p className="drop-hint">Drop file here or click to browse</p>
      {file ? <p className="drop-file">Selected: {file.name}</p> : null}
    </div>
  );
}

export default FileDropZone;
