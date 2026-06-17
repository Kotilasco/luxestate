# LuxEstate

Laravel and Bootstrap real estate landing page based on the LuxEstate demo layout.

## Requirements

- Docker, or PHP 8.2+ with Composer
- Internet access for Bootstrap, Bootstrap Icons, Google Fonts, and demo image assets loaded from CDN/remote URLs

## Start With Docker

From the project root:

```bash
docker run --rm -v ${PWD}:/app -w /app composer:2 composer install
copy .env.example .env
docker run --rm -v ${PWD}:/app -w /app composer:2 php artisan key:generate
docker run -d --name luxestate-app -p 8001:8000 -v ${PWD}:/app -w /app composer:2 php artisan serve --host=0.0.0.0 --port=8000
```

Open:

```text
http://127.0.0.1:8001
```

Stop the server:

```bash
docker stop luxestate-app
```

If the container name already exists:

```bash
docker rm luxestate-app
```

## Start With Local PHP

```bash
composer install
copy .env.example .env
php artisan key:generate
php artisan serve
```

Open:

```text
http://127.0.0.1:8000
```

## Main Files

- `resources/views/home.blade.php` - homepage markup
- `public/css/luxestate.css` - Bootstrap custom styling, hover effects, and responsive layout
- `public/js/luxestate.js` - navigation behavior and animated counters
- `routes/web.php` - Laravel route for `/`
