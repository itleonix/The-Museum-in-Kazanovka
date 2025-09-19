from django.contrib import admin
from django.db import models
from django.utils.html import format_html
from .models import Section, Subsection, Item, ItemImage
from .widgets import DragAndDropImageWidget, DragAndDropFileWidget
from django import forms
try:
    from ckeditor.widgets import CKEditorWidget
except Exception:  # pragma: no cover
    CKEditorWidget = None

@admin.register(Section)
class SectionAdmin(admin.ModelAdmin):
    list_display = ("name", "ordering", "slug", "color", "icon_preview")
    fields = ("name", "slug", "ordering", "color", "icon")
    search_fields = ("name", "slug")
    prepopulated_fields = {"slug": ("name",)}
    ordering = ("ordering", "name")
    formfield_overrides = {
        models.ImageField: {"widget": DragAndDropImageWidget}
    }

    def icon_preview(self, obj):
        if obj.icon:
            return format_html('<img src="{}" style="height:20px;"/>', obj.icon.url)
        return "-"
    icon_preview.short_description = "Иконка"

@admin.register(Subsection)
class SubsectionAdmin(admin.ModelAdmin):
    list_display = ("name", "section", "ordering", "slug")
    list_filter = ("section",)
    search_fields = ("name", "slug", "section__name")
    prepopulated_fields = {"slug": ("name",)}
    raw_id_fields = ("section",)
    ordering = ("section__ordering", "ordering", "name")

class ItemImageInline(admin.TabularInline):
    model = ItemImage
    extra = 0
    fields = ("ordering", "image")
    formfield_overrides = {
        models.ImageField: {"widget": DragAndDropImageWidget}
    }

@admin.register(Item)
class ItemAdmin(admin.ModelAdmin):
    list_display = ("title", "node")
    inlines = [ItemImageInline]
    fields = ("node", "title", "slug", "description", "display_images_count", "video", "model_3d")  # видео и 3D модель
    prepopulated_fields = {"slug": ("title",)}
    change_form_template = "admin/core/item/change_form.html"

    def get_form(self, request, obj=None, **kwargs):
        form = super().get_form(request, obj, **kwargs)
        if CKEditorWidget:
            try:
                form.base_fields['description'].widget = CKEditorWidget(config_name='default')
            except Exception:
                pass
        # drag&drop для видео и 3D модели
        try:
            if 'video' in form.base_fields:
                form.base_fields['video'].widget = DragAndDropFileWidget(attrs={'accept': 'video/*'})
        except Exception:
            pass
        try:
            if 'model_3d' in form.base_fields:
                # Точно так же, как видео, только ограничим расширения до glb/gltf
                form.base_fields['model_3d'].widget = DragAndDropFileWidget(attrs={'accept': '.glb,.gltf'})
        except Exception:
            pass
        return form

    def save_related(self, request, form, formsets, change):
        super().save_related(request, form, formsets, change)
        files = request.FILES.getlist('bulk_images')
        if files:
            obj = form.instance
            start = obj.images.aggregate(m=models.Max('ordering')).get('m') or 0
            created = 0
            for idx, f in enumerate(files, start=1):
                content_type = getattr(f, 'content_type', '') or ''
                if not content_type.startswith('image/'):
                    continue
                ItemImage.objects.create(item=obj, image=f, ordering=start + idx)
                created += 1
            # опционально можно показать сообщение
            from django.contrib import messages
            if created:
                messages.success(request, f"Загружено фото: {created}")
