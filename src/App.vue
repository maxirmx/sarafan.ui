<script setup>
// Copyright (C) 2026 Maxim [maxirmx] Samsonov (www.sw.consulting)
// All rights reserved.
// This file is a part of Sarafan application

import { onMounted, ref } from 'vue'

import { version } from '@/../package.json'

const coreVersion = ref('')

async function fetchCoreVersion() {
  try {
    const response = await globalThis.fetch('/api/status/status')
    if (!response.ok) return

    const status = await response.json()
    coreVersion.value = status.appVersion ?? ''
  } catch {
    // Version information is optional and must not prevent the application from loading.
  }
}

onMounted(fetchCoreVersion)
</script>

<template>
  <v-app class="sarafan-app">
    <div class="app-frame">
      <aside class="sidebar">
        <a
          class="brand"
          href="#"
          aria-label="Сарафан — главная"
          @click.prevent
        >
          <span
            class="brand-mark"
            aria-hidden="true"
          >
            <span class="brand-mark__s">С</span>
          </span>
          <span class="brand-copy">
            <strong>Сарафан</strong>
            <small>доставка с заботой</small>
          </span>
        </a>

        <nav
          class="sidebar-nav"
          aria-label="Основная навигация"
        >
          <p class="nav-caption">
            Меню
          </p>

          <button
            class="nav-item nav-item--active"
            type="button"
          >
            <v-icon
              icon="$home"
              size="20"
            />
            <span>Главная</span>
          </button>
          <button
            class="nav-item"
            type="button"
          >
            <v-icon
              icon="$orders"
              size="20"
            />
            <span>Мои заказы</span>
            <span class="nav-count">2</span>
          </button>
          <button
            class="nav-item"
            type="button"
          >
            <v-icon
              icon="$profile"
              size="20"
            />
            <span>Профиль</span>
          </button>
        </nav>

        <div class="sidebar-spacer" />

        <div class="support-card">
          <span class="support-card__icon">
            <v-icon
              icon="$help"
              size="22"
            />
          </span>
          <strong>Нужна помощь?</strong>
          <p>Подскажем по заказу и доставке</p>
          <button type="button">
            Написать нам
          </button>
        </div>

        <button
          class="nav-item nav-item--muted"
          type="button"
        >
          <v-icon
            icon="$logout"
            size="20"
          />
          <span>Выйти</span>
        </button>

        <div class="version-info">
          <span>Клиент {{ version }}</span>
          <span v-if="coreVersion">Сервер {{ coreVersion }}</span>
        </div>
      </aside>

      <div class="app-stage">
        <header class="topbar">
          <a
            class="brand brand--mobile"
            href="#"
            aria-label="Сарафан — главная"
            @click.prevent
          >
            <span
              class="brand-mark"
              aria-hidden="true"
            >
              <span class="brand-mark__s">С</span>
            </span>
            <span class="brand-copy">
              <strong>Сарафан</strong>
            </span>
          </a>

          <div class="page-title">
            <span>Личный кабинет</span>
            <strong>Главная</strong>
          </div>

          <div class="topbar-actions">
            <button
              class="icon-button notification-button"
              type="button"
              aria-label="Уведомления"
            >
              <v-icon
                icon="$bell"
                size="20"
              />
              <span class="notification-dot" />
            </button>
            <button
              class="profile-button"
              type="button"
              aria-label="Открыть профиль Марии Ковалёвой"
            >
              <span class="profile-avatar">МК</span>
              <span class="profile-copy">
                <strong>Мария</strong>
                <small>Ковалёва</small>
              </span>
              <v-icon
                icon="$dropdown"
                size="18"
              />
            </button>
          </div>
        </header>

        <v-main class="main-area">
          <div class="page-content">
            <section
              class="hero-section"
              aria-labelledby="hero-title"
            >
              <div
                class="hero-pattern"
                aria-hidden="true"
              >
                <span class="route-dot route-dot--one" />
                <span class="route-dot route-dot--two" />
                <span class="route-dot route-dot--three" />
                <span class="route-line route-line--one" />
                <span class="route-line route-line--two" />
              </div>

              <div class="hero-content">
                <span class="hero-kicker">Добрый день, Мария</span>
                <h1 id="hero-title">
                  Покупки по всему миру —<br>
                  <em>просто передайте ссылку</em>
                </h1>
                <p>
                  Мы выкупим товар, проверим его на складе и доставим к вашей двери.
                </p>
                <div class="hero-trust">
                  <span>
                    <v-icon
                      icon="$globe"
                      size="18"
                    />
                    Магазины США и Европы
                  </span>
                  <span class="hero-trust__divider" />
                  <span>Поддержка на каждом этапе</span>
                </div>
              </div>

              <div
                class="hero-stamp"
                aria-hidden="true"
              >
                <span>из магазина</span>
                <strong>к вам</strong>
                <span>бережно</span>
              </div>
            </section>

            <section
              class="link-composer"
              aria-labelledby="link-title"
            >
              <div class="composer-heading">
                <span class="composer-icon">
                  <v-icon
                    icon="$link"
                    size="22"
                  />
                </span>
                <div>
                  <h2 id="link-title">
                    Что хотите заказать?
                  </h2>
                  <p>Вставьте ссылку на товар из любого интернет-магазина</p>
                </div>
              </div>

              <div class="composer-form">
                <v-text-field
                  aria-label="Ссылка на товар"
                  bg-color="#f7f2eb"
                  hide-details
                  placeholder="https://store.com/product..."
                  prepend-inner-icon="$link"
                  rounded="lg"
                  variant="solo-filled"
                />
                <v-btn
                  append-icon="$arrowright"
                  class="composer-button"
                  color="primary"
                  elevation="0"
                  rounded="lg"
                  size="large"
                >
                  Создать заказ
                </v-btn>
              </div>
              <p class="composer-note">
                Расчёт бесплатный и ни к чему вас не обязывает
              </p>
            </section>

            <div class="dashboard-grid">
              <section
                class="orders-section"
                aria-labelledby="orders-title"
              >
                <div class="section-heading">
                  <div>
                    <span class="section-kicker">В пути и в работе</span>
                    <h2 id="orders-title">
                      Активные заказы
                    </h2>
                  </div>
                  <button
                    class="text-action"
                    type="button"
                  >
                    Все заказы
                    <v-icon
                      icon="$arrowright"
                      size="18"
                    />
                  </button>
                </div>

                <article class="order-card">
                  <div class="product-visual product-visual--shoe">
                    <span aria-hidden="true">👟</span>
                  </div>
                  <div class="order-summary">
                    <div class="order-meta">
                      <span class="order-number">SRF-000123</span>
                      <span class="status-pill status-pill--review">Проверяем заказ</span>
                    </div>
                    <h3>Nike Air Max 90 Essential</h3>
                    <p class="store-domain">
                      nike.com · 1 товар
                    </p>

                    <div class="order-progress">
                      <div class="progress-labels">
                        <span>Заказ оформлен</span>
                        <strong>На проверке</strong>
                        <span>Доставка</span>
                      </div>
                      <v-progress-linear
                        color="primary"
                        height="6"
                        :model-value="46"
                        rounded
                      />
                    </div>
                  </div>
                  <div class="order-price">
                    <small>Ожидаемая стоимость</small>
                    <strong>€ 129,90</strong>
                    <button
                      class="circle-action"
                      type="button"
                      aria-label="Открыть заказ SRF-000123"
                    >
                      <v-icon
                        icon="$arrowright"
                        size="20"
                      />
                    </button>
                  </div>
                </article>

                <article class="order-card">
                  <div class="product-visual product-visual--bag">
                    <span aria-hidden="true">▱</span>
                  </div>
                  <div class="order-summary">
                    <div class="order-meta">
                      <span class="order-number">SRF-000119</span>
                      <span class="status-pill status-pill--payment">Ожидает оплаты</span>
                    </div>
                    <h3>Mini Quilted Shoulder Bag</h3>
                    <p class="store-domain">
                      cos.com · 1 товар
                    </p>

                    <div class="order-progress">
                      <div class="progress-labels">
                        <span>Заказ оформлен</span>
                        <strong>К оплате</strong>
                        <span>Доставка</span>
                      </div>
                      <v-progress-linear
                        color="secondary"
                        height="6"
                        :model-value="68"
                        rounded
                      />
                    </div>
                  </div>
                  <div class="order-price">
                    <small>К оплате</small>
                    <strong>$ 85,00</strong>
                    <button
                      class="circle-action circle-action--green"
                      type="button"
                      aria-label="Открыть заказ SRF-000119"
                    >
                      <v-icon
                        icon="$arrowright"
                        size="20"
                      />
                    </button>
                  </div>
                </article>
              </section>

              <aside class="side-rail">
                <section
                  class="journey-card"
                  aria-labelledby="journey-title"
                >
                  <span class="section-kicker">Как это работает</span>
                  <h2 id="journey-title">
                    От ссылки до двери
                  </h2>

                  <ol class="journey-list">
                    <li class="journey-step journey-step--done">
                      <span>1</span>
                      <div>
                        <strong>Отправьте ссылку</strong>
                        <small>На товар из магазина</small>
                      </div>
                    </li>
                    <li class="journey-step journey-step--active">
                      <span>2</span>
                      <div>
                        <strong>Получите расчёт</strong>
                        <small>Цена, комиссия и доставка</small>
                      </div>
                    </li>
                    <li class="journey-step">
                      <span>3</span>
                      <div>
                        <strong>Мы всё сделаем</strong>
                        <small>Выкупим, проверим, отправим</small>
                      </div>
                    </li>
                    <li class="journey-step">
                      <span>4</span>
                      <div>
                        <strong>Получите заказ</strong>
                        <small>Доставка до вашей двери</small>
                      </div>
                    </li>
                  </ol>
                </section>

                <section class="referral-card">
                  <div
                    class="referral-mark"
                    aria-hidden="true"
                  >
                    <span>С</span>
                  </div>
                  <div>
                    <span class="section-kicker">Сарафанное радио</span>
                    <h3>Делитесь — доставка станет выгоднее</h3>
                    <button type="button">
                      Скоро
                    </button>
                  </div>
                </section>
              </aside>
            </div>
          </div>
        </v-main>
      </div>
    </div>

    <nav
      class="mobile-nav"
      aria-label="Мобильная навигация"
    >
      <button
        class="mobile-nav__item mobile-nav__item--active"
        type="button"
      >
        <v-icon
          icon="$home"
          size="21"
        />
        <span>Главная</span>
      </button>
      <button
        class="mobile-nav__item"
        type="button"
      >
        <v-icon
          icon="$orders"
          size="21"
        />
        <span>Заказы</span>
      </button>
      <button
        class="mobile-nav__item mobile-nav__item--create"
        type="button"
        aria-label="Создать заказ"
      >
        <span>
          <v-icon
            icon="$plus"
            size="24"
          />
        </span>
      </button>
      <button
        class="mobile-nav__item"
        type="button"
      >
        <v-icon
          icon="$help"
          size="21"
        />
        <span>Помощь</span>
      </button>
      <button
        class="mobile-nav__item"
        type="button"
      >
        <v-icon
          icon="$profile"
          size="21"
        />
        <span>Профиль</span>
      </button>
    </nav>
  </v-app>
</template>
