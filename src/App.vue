<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useForm } from 'vee-validate';
import { toTypedSchema } from '@vee-validate/zod';
import { z } from 'zod';
import Button from 'primevue/button';
import Card from 'primevue/card';
import InputNumber from 'primevue/inputnumber';
import InputText from 'primevue/inputtext';
import Message from 'primevue/message';
import Select from 'primevue/select';
import SelectButton from 'primevue/selectbutton';
import Toast from 'primevue/toast';
import { useToast } from 'primevue/usetoast';
import { useI18n } from 'vue-i18n';

import { mockApi } from './mock';
import {
  createVolumePayload,
  unitsBySystem,
  volumeNamePattern,
  type MeasurementSystem,
  type SizeUnit,
  type VolumePayload,
  type VolumeType,
} from './lib/volume';

const { t } = useI18n();

const typeOptions = computed<Array<{ label: string; value: VolumeType }>>(() => [
  { label: t('form.typeBlock'), value: 'block' },
  { label: t('form.typeFile'), value: 'file' },
]);

const measurementOptions = computed<
  Array<{ label: string; value: MeasurementSystem; hint: string }>
>(() => [
  { label: t('measurement.decimal'), value: 'decimal', hint: t('measurement.decimalHint') },
  { label: t('measurement.binary'), value: 'binary', hint: t('measurement.binaryHint') },
]);

const validationSchema = toTypedSchema(
  z.object({
    name: z
      .string()
      .trim()
      .min(1, t('validation.nameRequired'))
      .regex(volumeNamePattern, t('validation.namePattern')),
    type: z.enum(['block', 'file'], t('validation.typeRequired')),
    size: z
      .number(t('validation.sizeInvalid'))
      .positive(t('validation.sizePositive'))
      .max(999999, t('validation.sizeTooLarge')),
    unit: z.enum(['KB', 'MB', 'GB', 'KiB', 'MiB', 'GiB'], t('validation.unitRequired')),
  }),
);

const toast = useToast();
const measurementSystem = ref<MeasurementSystem>('decimal');
const submittedPayload = ref<VolumePayload | null>(null);
const apiError = ref('');
const isCheckingName = ref(false);

const { defineField, errors, handleSubmit, resetForm, setFieldError, setFieldValue } = useForm({
  validationSchema,
  initialValues: {
    name: '',
    type: 'block' as VolumeType,
    size: 100,
    unit: 'GB' as SizeUnit,
  },
});

const [name, nameAttrs] = defineField('name');
const [type, typeAttrs] = defineField('type');
const [size, sizeAttrs] = defineField('size');
const [unit, unitAttrs] = defineField('unit');

const unitOptions = computed(() =>
  unitsBySystem[measurementSystem.value].map((value) => ({
    label: value,
    value,
  })),
);

const selectedSystemHint = computed(
  () =>
    measurementOptions.value.find((option) => option.value === measurementSystem.value)?.hint ??
    '',
);

const formattedPayload = computed(() =>
  submittedPayload.value ? JSON.stringify(submittedPayload.value, null, 2) : '',
);

watch(measurementSystem, (system) => {
  setFieldValue('unit', unitsBySystem[system][2]);
});

const onSubmit = handleSubmit(async (values) => {
  apiError.value = '';
  isCheckingName.value = true;

  try {
    const result = await mockApi.checkName(values.name.trim());

    if (!result.unique) {
      setFieldError('name', t('validation.nameTaken'));
      submittedPayload.value = null;
      return;
    }

    submittedPayload.value = createVolumePayload({
      name: values.name,
      type: values.type,
      size: values.size,
      unit: values.unit,
    });

    toast.add({
      severity: 'success',
      summary: t('toast.volumeReady'),
      detail: t('toast.payloadGenerated'),
      life: 2200,
    });
  } catch {
    apiError.value = t('api.nameCheckFailed');
    submittedPayload.value = null;
  } finally {
    isCheckingName.value = false;
  }
});

function clearForm() {
  apiError.value = '';
  submittedPayload.value = null;
  resetForm({
    values: {
      name: '',
      type: 'block',
      size: 100,
      unit: unitsBySystem[measurementSystem.value][2],
    },
  });
}
</script>

<template>
  <main class="mx-auto min-h-screen w-full max-w-6xl px-3.5 py-6 sm:px-5 sm:py-8">
    <Toast />

    <header class="mb-5 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
      <div>
        <p class="mb-1.5 text-xs font-extrabold uppercase text-teal-700">
          {{ t('app.eyebrow') }}
        </p>
        <h1 class="text-3xl font-bold leading-tight text-slate-950 sm:text-4xl">
          {{ t('app.title') }}
        </h1>
      </div>

      <div
        class="grid justify-items-start gap-2 md:justify-items-end"
        :aria-label="t('measurement.ariaLabel')"
      >
        <span class="text-sm font-bold text-slate-700">{{ t('measurement.label') }}</span>
        <SelectButton
          v-model="measurementSystem"
          :options="measurementOptions"
          option-label="label"
          option-value="value"
          :allow-empty="false"
          class="border border-slate-200"
        />
        <small class="text-slate-500">{{ selectedSystemHint }}</small>
      </div>
    </header>

    <section class="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(340px,0.82fr)]">
      <Card class="animate-card-in overflow-hidden rounded-lg">
        <template #title>
          {{ t('form.title') }}
        </template>
        <template #content>
          <form
            class="grid gap-4.5"
            @submit="onSubmit"
          >
            <label class="grid gap-2">
              <span class="text-sm font-bold text-slate-700">{{ t('form.name') }}</span>
              <InputText
                v-model="name"
                v-bind="nameAttrs"
                :placeholder="t('form.namePlaceholder')"
              />
              <Message
                v-if="errors.name"
                severity="error"
                size="small"
                variant="simple"
              >
                {{ errors.name }}
              </Message>
            </label>

            <label class="grid gap-2">
              <span class="text-sm font-bold text-slate-700">{{ t('form.type') }}</span>
              <SelectButton
                v-model="type"
                v-bind="typeAttrs"
                :options="typeOptions"
                option-label="label"
                option-value="value"
                :allow-empty="false"
              />
              <Message
                v-if="errors.type"
                severity="error"
                size="small"
                variant="simple"
              >
                {{ errors.type }}
              </Message>
            </label>

            <div class="grid items-start gap-3.5 sm:grid-cols-[minmax(0,1fr)_160px]">
              <label class="grid gap-2">
                <span class="text-sm font-bold text-slate-700">{{ t('form.size') }}</span>
                <InputNumber
                  v-model="size"
                  v-bind="sizeAttrs"
                  :min="0"
                  :min-fraction-digits="0"
                  :max-fraction-digits="2"
                  input-id="size"
                  mode="decimal"
                  show-buttons
                />
                <Message
                  v-if="errors.size"
                  severity="error"
                  size="small"
                  variant="simple"
                >
                  {{ errors.size }}
                </Message>
              </label>

              <label class="grid w-full self-start gap-2">
                <span class="text-sm font-bold text-slate-700">{{ t('form.unit') }}</span>
                <Select
                  v-model="unit"
                  v-bind="unitAttrs"
                  :options="unitOptions"
                  option-label="label"
                  option-value="value"
                  class="w-full [&_.p-select-label]:flex [&_.p-select-label]:items-center"
                />
                <Message
                  v-if="errors.unit"
                  severity="error"
                  size="small"
                  variant="simple"
                >
                  {{ errors.unit }}
                </Message>
              </label>
            </div>

            <Message
              v-if="apiError"
              severity="error"
              size="small"
            >
              <i
                class="pi pi-exclamation-triangle text-sm! text-teal-700"
                aria-hidden="true"
              />
              {{ apiError }}
            </Message>

            <div class="flex flex-wrap justify-end gap-4 pt-1">
              <Button
                type="submit"
                icon="pi pi-save"
                :label="t('form.save')"
                :loading="isCheckingName"
              />
              <Button
                type="button"
                icon="pi pi-refresh"
                :label="t('form.reset')"
                severity="secondary"
                outlined
                @click="clearForm"
              />
            </div>
          </form>
        </template>
      </Card>

      <Card class="animate-card-in-delayed overflow-hidden rounded-lg">
        <template #title>
          {{ t('payload.title') }}
        </template>
        <template #subtitle>
          {{ t('payload.subtitle') }}
        </template>
        <template #content>
          <div
            v-if="submittedPayload"
            class="grid content-start gap-3.5"
          >
            <pre
              class="m-0 overflow-auto rounded-lg border border-slate-700 bg-slate-950 p-4 text-sm leading-6 text-emerald-50"
            >{{ formattedPayload }}</pre>
          </div>

          <div
            v-else
            class="grid min-h-72 place-content-center justify-items-center gap-3 rounded-lg border border-dashed border-slate-300 p-6 text-center text-slate-500"
          >
            <i
              class="pi pi-database text-3xl! text-teal-700"
              aria-hidden="true"
            />
            <p class="max-w-xs leading-6">
              {{ t('payload.empty') }}
            </p>
          </div>
        </template>
      </Card>
    </section>
  </main>
</template>
