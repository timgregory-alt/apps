-- Tennessee Wine Passport — migration 0012: replace Terrier Rosato's
-- generic placeholder tasting notes with the real varietal and copy
-- from Woodfeather Farm's own retailer listing.

update public.wines set
  varietal = 'Vidal Blanc & Sunbelt Blend',
  tasting_notes = 'A blend of Tennessee Vidal Blanc and Sunbelt, reflecting the lively spirit of the Terrier — bright peach, honeysuckle, and stone fruit with subtle oak spice and vanilla. Crisp yet smooth, with a refreshing, spirited finish.'
where slug = 'woodfeather-terrier-rosato';
