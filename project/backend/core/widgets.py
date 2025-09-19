from django.forms.widgets import ClearableFileInput
from django.utils.safestring import mark_safe


class DragAndDropImageWidget(ClearableFileInput):
    template_with_initial = (
        '%(clear_template)s %(input_text)s: %(input)s'
    )

    def render(self, name, value, attrs=None, renderer=None):
        original = super().render(name, value, attrs, renderer)
        html = f'''
        <div class="dnd-file" data-field="{name}">
            <div class="dnd-dropzone">Перетащите фото сюда или кликните для выбора</div>
            <div class="dnd-native">{original}</div>
            <div class="dnd-preview"></div>
        </div>
        '''
        return mark_safe(html)

    class Media:
        css = {
            'all': ('admin/dragndrop.css',)
        }
        js = ('admin/dragndrop.js',)


class DragAndDropFileWidget(ClearableFileInput):
    template_with_initial = (
        '%(clear_template)s %(input_text)s: %(input)s'
    )

    def render(self, name, value, attrs=None, renderer=None):
        original = super().render(name, value, attrs, renderer)
        # Добавляем класс dnd-any, чтобы JS знал показывать плашку с именем файла
        html = f'''
        <div class="dnd-file dnd-any" data-field="{name}">
            <div class="dnd-dropzone">Перетащите файл сюда или кликните для выбора</div>
            <div class="dnd-native">{original}</div>
            <div class="dnd-preview"></div>
        </div>
        '''
        return mark_safe(html)

    class Media:
        css = {
            'all': ('admin/dragndrop.css',)
        }
        js = ('admin/dragndrop.js',)
