import type { BuilderPreset } from '../types'

export const conditionalFieldsPreset: BuilderPreset = {
  id: 'conditional-fields',
  name: 'Conditional Fields (oneOf)',
  description: 'Demonstrates schema composition with if/then and oneOf.',
  document: {
    schema: {
      title: 'Shipping Details',
      type: 'object',
      required: ['shippingMethod'],
      properties: {
        shippingMethod: {
          type: 'string',
          title: 'Shipping method',
          enum: ['standard', 'express'],
          default: 'standard',
        },
      },
      dependencies: {
        shippingMethod: {
          oneOf: [
            {
              properties: {
                shippingMethod: { const: 'standard' },
              },
            },
            {
              properties: {
                shippingMethod: { const: 'express' },
                expressReason: {
                  type: 'string',
                  title: 'Reason for express shipping',
                },
              },
              required: ['expressReason'],
            },
          ],
        },
      },
    },
    uiSchema: {},
    formData: {
      shippingMethod: 'standard',
    },
  },
}
