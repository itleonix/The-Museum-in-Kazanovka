from django.db import models
from django.utils.text import slugify
from django.core.validators import FileExtensionValidator

class Section(models.Model):
    name = models.CharField("Раздел", max_length=200)
    slug = models.SlugField("Слаг", max_length=220, unique=True, blank=True)
    ordering = models.PositiveIntegerField("Порядок", default=0)

    icon = models.ImageField("Иконка", upload_to="section_icons/", blank=True, null=True)
    color = models.CharField(
        "Цвет", max_length=50, blank=True,
    )

    class Meta:
        ordering = ("ordering", "name")
        verbose_name = "Раздел"
        verbose_name_plural = "Разделы"

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name, allow_unicode=True)
        super().save(*args, **kwargs)


class Subsection(models.Model):
    section = models.ForeignKey(
        Section, on_delete=models.CASCADE, related_name="subsections", verbose_name="Раздел"
    )
    name = models.CharField("Подраздел", max_length=200)
    slug = models.SlugField("Слаг", max_length=220, blank=True)
    ordering = models.PositiveIntegerField("Порядок", default=0)

    class Meta:
        unique_together = (("section", "slug"),)
        ordering = ("section__ordering", "ordering", "name")
        verbose_name = "Подраздел"
        verbose_name_plural = "Подразделы"

    def __str__(self):
        return f"{self.section} → {self.name}"

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name, allow_unicode=True)
        super().save(*args, **kwargs)


# --- helper paths (ВНЕ классов!) ---
def item_image_upload_to(instance, filename):
    # instance: ItemImage
    return f"items/{instance.item_id}/photos/{filename}"

def item_video_upload_to(instance, filename):
    # instance: Item
    # pk уже есть при редактировании; при создании через админку Django сначала сохранит Item → pk будет.
    item_id = instance.pk or "tmp"
    return f"items/{item_id}/video/{filename}"

def item_3d_upload_to(instance, filename):
    # путь для 3D‑моделей конкретного элемента
    item_id = instance.pk or "tmp"
    return f"items/{item_id}/3d/{filename}"


class Item(models.Model):
    node = models.ForeignKey(
        'Subsection',
        on_delete=models.PROTECT,
        related_name="Элементы",
        verbose_name="Подподраздел",
        null=True, blank=True
    )
    title = models.CharField("Элемент", max_length=200)
    slug = models.SlugField("Слаг", max_length=220, unique=True, blank=True)
    description = models.TextField("Описание", blank=True)

    display_images_count = models.PositiveIntegerField(
        "Количество отображаемых изображений",
        default=0,
        help_text="0 — показывать все"
    )

    # одно видео
    video = models.FileField(
        "Видео",
        upload_to=item_video_upload_to,
        blank=True, null=True,
        validators=[FileExtensionValidator(allowed_extensions=["mp4", "mov", "webm", "mkv"])]
    )

    # 3D‑модель (GLB/GLTF)
    model_3d = models.FileField(
        "3D модель",
        upload_to=item_3d_upload_to,
        blank=True, null=True,
        validators=[FileExtensionValidator(allowed_extensions=["glb", "gltf"])]
    )

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.title, allow_unicode=True)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.title


class ItemImage(models.Model):
    item = models.ForeignKey(
        Item, on_delete=models.CASCADE,
        related_name="images", verbose_name="Элемент"
    )
    image = models.ImageField("Фото", upload_to=item_image_upload_to)
    ordering = models.PositiveIntegerField("Порядок", default=0)

    class Meta:
        ordering = ("ordering", "id")
        verbose_name = "Фото"
        verbose_name_plural = "Фото"

    def __str__(self):
        return f"{self.item} — { self.image.name}"
