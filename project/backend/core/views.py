from django.shortcuts import render, get_object_or_404
from django.http import JsonResponse, Http404
from django.conf import settings
from django.templatetags.static import static
from .models import Section, Item

# Create your views here.
def section(request):
    sections = Section.objects.all()
    return render(request, "section.html", {"sections": sections})

def three_demo(request):
    return render(request, "three_demo.html")

def three_viewer(request):
    return render(request, "three_viewer.html")

def section_data(request, slug):
    section = get_object_or_404(Section, slug=slug)
    # подтянуть подразделы и их элементы
    subs = (section.subsections
            .all()
            .order_by("ordering", "name")
            .prefetch_related("Элементы"))

    data = {
        "section": {
            "name": section.name,
            "slug": section.slug,
        },
        "subsections": [
            {
                "name": sub.name,
                "slug": sub.slug,
                "items": [
                    {
                        "title": it.title,
                        "slug": it.slug,
                        "description": it.description or "",
                    }
                    for it in sub.Элементы.all().order_by("title")
                ],
            }
            for sub in subs
        ],
    }
    return JsonResponse(data)


def item_data(request, slug):
    """Return JSON with item details for AJAX detail view."""
    item = get_object_or_404(Item.objects.select_related("node", "node__section").prefetch_related("images"), slug=slug)

    # Safe URLs for media
    def build_url(file_field):
        try:
            return file_field.url if file_field else ""
        except ValueError:
            return ""

    data = {
        "title": item.title,
        "slug": item.slug,
        "description": item.description or "",
        "video": build_url(item.video),
        "model_3d": build_url(getattr(item, 'model_3d', None)),
        "display_images_count": item.display_images_count,
        "images": [build_url(img.image) for img in item.images.all()],
        "subsection": getattr(item.node, "name", ""),
        "section": getattr(getattr(item.node, "section", None), "name", ""),
    }
    return JsonResponse(data)
