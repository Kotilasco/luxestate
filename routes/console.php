<?php

use Illuminate\Support\Facades\Artisan;

Artisan::command('inspire', function (): void {
    $this->comment('Find the property, frame the story, close with confidence.');
})->purpose('Display an inspiring message');
