from django.db import migrations, models
import core.models
from django.core.validators import FileExtensionValidator


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0008_item_display_images_count'),
    ]

    operations = [
        migrations.AddField(
            model_name='item',
            name='model_3d',
            field=models.FileField(
                verbose_name='3D модель',
                upload_to=core.models.item_3d_upload_to,
                blank=True,
                null=True,
                validators=[FileExtensionValidator(allowed_extensions=['glb', 'gltf'])],
            ),
        ),
    ]

