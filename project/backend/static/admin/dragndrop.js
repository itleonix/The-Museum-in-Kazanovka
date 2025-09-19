// Включаем drag & drop для всех .dnd-file
(function () {
  function initDnd(wrapper) {
    var dropzone = wrapper.querySelector('.dnd-dropzone');
    var input = wrapper.querySelector('input[type="file"]');
    var preview = wrapper.querySelector('.dnd-preview');
    if (!dropzone || !input) return;

    function prevent(e) { e.preventDefault(); e.stopPropagation(); }
    ['dragenter','dragover','dragleave','drop'].forEach(function (evt) {
      dropzone.addEventListener(evt, prevent, false);
    });
    ['dragenter','dragover'].forEach(function (evt) {
      dropzone.addEventListener(evt, function(){ dropzone.classList.add('is-dragover'); }, false);
    });
    ['dragleave','drop'].forEach(function (evt) {
      dropzone.addEventListener(evt, function(){ dropzone.classList.remove('is-dragover'); }, false);
    });

    dropzone.addEventListener('click', function(){ input.click(); }, false);

    function showPreviewFromFile(file) {
      if (!preview) return;
      preview.innerHTML = '';
      if (!file) return;
      // Для image показываем мини-превью, для остальных (если у контейнера класс dnd-any) — плашку с именем файла
      if (file.type && file.type.startsWith('image/')) {
        var reader = new FileReader();
        reader.onload = function (ev) {
          var img = document.createElement('img');
          img.src = ev.target.result;
          preview.appendChild(img);
        };
        reader.readAsDataURL(file);
      } else if (wrapper.classList.contains('dnd-any')) {
        var pill = document.createElement('span');
        pill.className = 'file-pill';
        pill.textContent = (file.name || 'файл') + (file.size ? ' · ' + Math.round(file.size/1024) + ' KB' : '');
        preview.appendChild(pill);
      }
    }

    dropzone.addEventListener('drop', function (e) {
      var dt = e.dataTransfer;
      if (!dt || !dt.files || !dt.files.length) return;
      var file = dt.files[0];
      // назначаем файл инпуту
      // Примечание: Прямое присваивание FileList не всегда поддерживается, но большинство браузеров ок
      try {
        input.files = dt.files;
      } catch (err) {
        // на крайний случай просто открываем диалог
        input.click();
      }
      showPreviewFromFile(file);
    }, false);

    input.addEventListener('change', function () {
      var file = input.files && input.files[0];
      showPreviewFromFile(file);
    }, false);
  }

  function initDndMulti(wrapper) {
    var dropzone = wrapper.querySelector('.dnd-dropzone');
    var input = wrapper.querySelector('input[type="file"][multiple]');
    var preview = wrapper.querySelector('.dnd-preview');
    if (!dropzone || !input) return;

    function prevent(e) { e.preventDefault(); e.stopPropagation(); }
    ['dragenter','dragover','dragleave','drop'].forEach(function (evt) {
      dropzone.addEventListener(evt, prevent, false);
    });
    ['dragenter','dragover'].forEach(function (evt) {
      dropzone.addEventListener(evt, function(){ dropzone.classList.add('is-dragover'); }, false);
    });
    ['dragleave','drop'].forEach(function (evt) {
      dropzone.addEventListener(evt, function(){ dropzone.classList.remove('is-dragover'); }, false);
    });

    dropzone.addEventListener('click', function(){ input.click(); }, false);

    function showPreviews(files) {
      if (!preview) return;
      preview.innerHTML = '';
      Array.prototype.slice.call(files || []).forEach(function(file){
        if (!file || !file.type || !file.type.startsWith('image/')) return;
        var reader = new FileReader();
        reader.onload = function (ev) {
          var img = document.createElement('img');
          img.src = ev.target.result;
          img.style.marginRight = '6px';
          preview.appendChild(img);
        };
        reader.readAsDataURL(file);
      });
    }

    dropzone.addEventListener('drop', function (e) {
      var dt = e.dataTransfer;
      if (!dt || !dt.files || !dt.files.length) return;
      // заменить текущее множество файлов на новые
      try {
        input.files = dt.files;
      } catch (err) {
        // если браузер не позволяет — просто открыть диалог выбора
        input.click();
      }
      showPreviews(dt.files);
    }, false);

    input.addEventListener('change', function () {
      showPreviews(input.files);
    }, false);
  }

  function initAll() {
    document.querySelectorAll('.dnd-file').forEach(initDnd);
    document.querySelectorAll('.dnd-multi').forEach(initDndMulti);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAll);
  } else {
    initAll();
  }
})();
