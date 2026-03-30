import Stripe from 'stripe'; const idx: Stripe.Invoice = {} as any; const type = idx.parent?.type; const sub = idx.parent?.subscription_details?.subscription;
