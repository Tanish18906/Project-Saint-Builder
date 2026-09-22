SET session_replication_role = replica;

--
-- PostgreSQL database dump
--

-- \restrict UEYDavza4ze0EcoghQUKQOFplwfWSXWYtbh6E5necYVVXB0Orrj2QT9ALhIuSXU

-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.6

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: audit_log_entries; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: custom_oauth_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: flow_state; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: users; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."users" ("instance_id", "id", "aud", "role", "email", "encrypted_password", "email_confirmed_at", "invited_at", "confirmation_token", "confirmation_sent_at", "recovery_token", "recovery_sent_at", "email_change_token_new", "email_change", "email_change_sent_at", "last_sign_in_at", "raw_app_meta_data", "raw_user_meta_data", "is_super_admin", "created_at", "updated_at", "phone", "phone_confirmed_at", "phone_change", "phone_change_token", "phone_change_sent_at", "email_change_token_current", "email_change_confirm_status", "banned_until", "reauthentication_token", "reauthentication_sent_at", "is_sso_user", "deleted_at", "is_anonymous") VALUES
	('00000000-0000-0000-0000-000000000000', '89181e09-49d2-48b1-8ecf-af060aa4cab8', 'authenticated', 'authenticated', 'test@allsaintsbuilders.com', '$2a$06$9f./Sm4YkKsJVM82iHnKJuPJTDKakFLnZvwJczVm1QYnUVETtfzhm', '2026-08-16 05:59:50.682995+00', NULL, 'ffdea471736a0a4672331c7f59ecf814d8296becfa0b63cf4bf2a950', '2026-08-16 05:59:42.671905+00', '', NULL, '', '', NULL, '2026-08-16 05:59:57.353383+00', '{"provider": "email", "providers": ["email"]}', '{"sub": "89181e09-49d2-48b1-8ecf-af060aa4cab8", "email": "test@allsaintsbuilders.com", "email_verified": false, "phone_verified": false}', NULL, '2026-08-16 05:59:42.624729+00', '2026-08-27 13:58:13.944286+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false),
	('00000000-0000-0000-0000-000000000000', 'dbe8ca18-844e-4064-a0fa-4a4d56e32ff5', 'authenticated', 'authenticated', '123@gmail.com', '$2a$10$DMhU5qrgTDEEwEEYBPzcLeACFXMK9qYpgjwkI5y9pcwE5z8HEbCVq', '2026-08-16 06:16:57.22664+00', NULL, '', NULL, '', NULL, '', '', NULL, '2026-08-23 13:04:01.875381+00', '{"provider": "email", "providers": ["email"]}', '{"email_verified": true}', NULL, '2026-08-16 06:16:57.216314+00', '2026-08-27 22:45:49.469962+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false);


--
-- Data for Name: identities; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."identities" ("provider_id", "user_id", "identity_data", "provider", "last_sign_in_at", "created_at", "updated_at", "id") VALUES
	('89181e09-49d2-48b1-8ecf-af060aa4cab8', '89181e09-49d2-48b1-8ecf-af060aa4cab8', '{"sub": "89181e09-49d2-48b1-8ecf-af060aa4cab8", "email": "test@allsaintsbuilders.com", "email_verified": false, "phone_verified": false}', 'email', '2026-08-16 05:59:42.662592+00', '2026-08-16 05:59:42.662647+00', '2026-08-16 05:59:42.662647+00', 'a986413a-434f-4553-a97e-d1c8bf29fc12'),
	('dbe8ca18-844e-4064-a0fa-4a4d56e32ff5', 'dbe8ca18-844e-4064-a0fa-4a4d56e32ff5', '{"sub": "dbe8ca18-844e-4064-a0fa-4a4d56e32ff5", "email": "123@gmail.com", "email_verified": false, "phone_verified": false}', 'email', '2026-08-16 06:16:57.2243+00', '2026-08-16 06:16:57.224351+00', '2026-08-16 06:16:57.224351+00', '3c6598b5-4a03-4e19-9087-b2c07ac7165b');


--
-- Data for Name: instances; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: oauth_clients; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: sessions; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."sessions" ("id", "user_id", "created_at", "updated_at", "factor_id", "aal", "not_after", "refreshed_at", "user_agent", "ip", "tag", "oauth_client_id", "refresh_token_hmac_key", "refresh_token_counter", "scopes") VALUES
	('8edd6d29-8818-4658-9960-a92b76bfd012', '89181e09-49d2-48b1-8ecf-af060aa4cab8', '2026-08-16 05:59:57.353512+00', '2026-08-16 05:59:57.353512+00', NULL, 'aal1', NULL, NULL, 'node', '106.207.232.102', NULL, NULL, NULL, NULL, NULL),
	('44fa8834-48f6-4259-940f-e05b37232c88', 'dbe8ca18-844e-4064-a0fa-4a4d56e32ff5', '2026-08-23 13:04:01.875496+00', '2026-08-27 22:45:51.201192+00', NULL, 'aal1', NULL, '2026-08-27 22:45:51.201064', 'Mozilla/5.0 (X11; Linux x86_64; rv:153.0) Gecko/20100101 Firefox/153.0', '110.227.62.239', NULL, NULL, NULL, NULL, NULL);


--
-- Data for Name: mfa_amr_claims; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."mfa_amr_claims" ("session_id", "created_at", "updated_at", "authentication_method", "id") VALUES
	('8edd6d29-8818-4658-9960-a92b76bfd012', '2026-08-16 05:59:57.379085+00', '2026-08-16 05:59:57.379085+00', 'password', 'efb75d7c-6f5d-42d1-b2cf-e83210ed6900'),
	('44fa8834-48f6-4259-940f-e05b37232c88', '2026-08-23 13:04:01.916423+00', '2026-08-23 13:04:01.916423+00', 'password', 'a506bc2a-d368-4a12-98ec-17ca4a149289');


--
-- Data for Name: mfa_factors; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: mfa_challenges; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: oauth_authorizations; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: oauth_client_states; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: oauth_consents; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: one_time_tokens; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."one_time_tokens" ("id", "user_id", "token_type", "token_hash", "relates_to", "created_at", "updated_at") VALUES
	('b6deebac-f0ea-419b-bb68-c15fdf17fe65', '89181e09-49d2-48b1-8ecf-af060aa4cab8', 'confirmation_token', 'ffdea471736a0a4672331c7f59ecf814d8296becfa0b63cf4bf2a950', 'test@allsaintsbuilders.com', '2026-08-16 05:59:43.303582', '2026-08-16 05:59:43.303582');


--
-- Data for Name: refresh_tokens; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."refresh_tokens" ("instance_id", "id", "token", "user_id", "revoked", "created_at", "updated_at", "parent", "session_id") VALUES
	('00000000-0000-0000-0000-000000000000', 1, 'whswejhajt6n', '89181e09-49d2-48b1-8ecf-af060aa4cab8', false, '2026-08-16 05:59:57.362625+00', '2026-08-16 05:59:57.362625+00', NULL, '8edd6d29-8818-4658-9960-a92b76bfd012'),
	('00000000-0000-0000-0000-000000000000', 24, 'rubob6pdrm3z', 'dbe8ca18-844e-4064-a0fa-4a4d56e32ff5', true, '2026-08-23 13:04:01.886913+00', '2026-08-27 17:02:12.215493+00', NULL, '44fa8834-48f6-4259-940f-e05b37232c88'),
	('00000000-0000-0000-0000-000000000000', 25, '27ua5gswm4gc', 'dbe8ca18-844e-4064-a0fa-4a4d56e32ff5', true, '2026-08-27 17:02:12.247985+00', '2026-08-27 18:01:04.015968+00', 'rubob6pdrm3z', '44fa8834-48f6-4259-940f-e05b37232c88'),
	('00000000-0000-0000-0000-000000000000', 26, 'dx3pstqvp3tp', 'dbe8ca18-844e-4064-a0fa-4a4d56e32ff5', true, '2026-08-27 18:01:04.053112+00', '2026-08-27 18:59:39.774623+00', '27ua5gswm4gc', '44fa8834-48f6-4259-940f-e05b37232c88'),
	('00000000-0000-0000-0000-000000000000', 27, 'lk6ezbliex2n', 'dbe8ca18-844e-4064-a0fa-4a4d56e32ff5', true, '2026-08-27 18:59:39.797528+00', '2026-08-27 19:58:23.941055+00', 'dx3pstqvp3tp', '44fa8834-48f6-4259-940f-e05b37232c88'),
	('00000000-0000-0000-0000-000000000000', 28, 'xmoaj64fwisr', 'dbe8ca18-844e-4064-a0fa-4a4d56e32ff5', true, '2026-08-27 19:58:23.976907+00', '2026-08-27 20:56:57.197919+00', 'lk6ezbliex2n', '44fa8834-48f6-4259-940f-e05b37232c88'),
	('00000000-0000-0000-0000-000000000000', 29, 'dk3lhv46wc4e', 'dbe8ca18-844e-4064-a0fa-4a4d56e32ff5', true, '2026-08-27 20:56:57.222004+00', '2026-08-27 22:45:49.445923+00', 'xmoaj64fwisr', '44fa8834-48f6-4259-940f-e05b37232c88'),
	('00000000-0000-0000-0000-000000000000', 30, 'yac7svmh7hzd', 'dbe8ca18-844e-4064-a0fa-4a4d56e32ff5', false, '2026-08-27 22:45:49.463209+00', '2026-08-27 22:45:49.463209+00', 'dk3lhv46wc4e', '44fa8834-48f6-4259-940f-e05b37232c88');


--
-- Data for Name: sso_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: saml_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: saml_relay_states; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: sso_domains; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: webauthn_challenges; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: webauthn_credentials; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: accounts; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."accounts" ("id", "email_address", "display_name", "created_at") VALUES
	('1e9dba44-7c3c-4b7b-a324-69f558d489f6', 'info@allsaintsbuilders.com', 'Info — Directors & Admin', '2026-08-12 07:08:00.360404+00'),
	('106596c5-de6f-4130-bf25-1c82fc5a9442', 'team@allsaintsbuilders.com', 'Team — Progressor & Ops', '2026-08-12 07:08:00.360404+00');


--
-- Data for Name: emails; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."emails" ("id", "account_id", "message_id", "thread_id", "from_address", "from_name", "subject", "body_text", "body_html", "received_at", "category", "routed_role", "status", "created_at", "theme", "urgency", "routed_roles") VALUES
	('08df1403-8e04-45d8-b927-27a752796428', '1e9dba44-7c3c-4b7b-a324-69f558d489f6', 'test-nph-finance-001', NULL, 'nphadfinance.nph@nph.org.uk', 'NPH AD Finance Team', 'NPH AD FINANCE - Overdue Invoice - PAYMENT CERT required', 'Dear Allsaints,

Our records show an overdue invoice against NPH contract ref 88213. We require a signed PAYMENT CERT from your office before we can release funds for the works already completed.

Please can you send the completed DISREP Payment Cert paperwork to this address so we can process payment. This is a finance/accounts matter only, not a request about the physical works.

Regards,
NPH AD Finance', NULL, '2026-08-26 10:00:00+00', NULL, NULL, 'classified', '2026-08-26 12:36:11.207102+00', 'finance', 'priority', '{director}'),
	('19e673c6-b765-407f-afe4-de7fb64b2ebf', '1e9dba44-7c3c-4b7b-a324-69f558d489f6', 'test-brewers-supplier-004', NULL, 'accounts@brewers.co.uk', 'Brewers Trade Accounts', 'Your Brewers trade account — credit terms review', 'Hi,

As part of our annual review of your ongoing trade account with us, we''d like to discuss your current credit limit and payment terms across all sites, not any single order.

Can someone from your office give us a call to go through the account relationship and confirm your preferred terms going forward?

Thanks,
Brewers Trade Accounts', NULL, '2026-08-26 10:15:00+00', NULL, NULL, 'classified', '2026-08-26 12:38:18.711513+00', 'suppliers', 'normal', '{director,senior_admin}'),
	('c50e7b2c-11ec-43bf-912d-afaa627a3cc5', '1e9dba44-7c3c-4b7b-a324-69f558d489f6', 'test-certificates-006', NULL, 'compliance@sparkelectrical.co.uk', 'Spark Electrical Compliance', 'MINOR WORKS certificate — 22 Baker Street sign-off required', 'Hi,

Please find attached the completed MINOR WORKS certificate for the ELECTRICAL works at 22 Baker Street. We need your sign-off on this before we can close out the job.

Regards,
Spark Electrical Compliance', NULL, '2026-08-26 11:10:00+00', NULL, NULL, 'classified', '2026-08-26 12:44:23.193697+00', 'certificates', 'priority', '{senior_admin,director}'),
	('e95ca137-e5a0-4e3e-9a00-c1b4c3c0d461', '106596c5-de6f-4130-bf25-1c82fc5a9442', 'r3-retest-3', NULL, 'office@allsaintsbuilders.com', 'Site Office', 'Fwd: Query re payment', 'Forwarding this below — can you take a look and respond?

---------- Forwarded message ---------
From: J. Pearson
Subject: Query re payment

Hello, I wanted to check on the status of a payment that was due to be processed for our recent works — it hasn''t shown up yet and I wanted to confirm nothing had gone wrong on your end.', NULL, '2026-08-26 12:00:00+00', NULL, NULL, 'classified', '2026-08-26 16:41:34.075485+00', 'finance', 'normal', '{director}'),
	('4d12c75f-b9b9-4bb3-a02a-8f134ff17fb3', '106596c5-de6f-4130-bf25-1c82fc5a9442', 'test-nph-jobupdate-002', NULL, 'j.whitfield@northampton.gov.uk', 'J. Whitfield, NPH', 'URGENT - NPH Job #4521 - DAMP AND MOULD Emergency - 12 Elm Street', 'Hi,

This is an Emergency DISRP case under NPH job #4521 at 12 Elm Street — tenant has reported severe DAMP AND MOULD in the back bedroom (DM/A&A). This needs to be treated as an urgent disrepair with safety implications, same-day attendance required.

Can you confirm your crew can attend today? This is about the physical works only — no finance or payment query here.

Regards,
J. Whitfield
NPH', NULL, '2026-08-26 10:05:00+00', NULL, NULL, 'classified', '2026-08-26 12:36:51.995149+00', 'nph_jobs', 'urgent', '{senior_admin}'),
	('24c38ce9-d034-4829-bfb6-d404c8b1a487', '1e9dba44-7c3c-4b7b-a324-69f558d489f6', 'test-meetings-before-005', NULL, 'sarah@rosewoodproperties.co.uk', 'Sarah Rosewood', 'Meeting request — site walkthrough next week', 'Hi,

Could we arrange a meeting for next Tuesday afternoon to walk through the completed works at 45 Mill Road and discuss the snagging list?

Let me know a time that suits your team.

Thanks,
Sarah', NULL, '2026-08-26 11:00:00+00', NULL, NULL, 'classified', '2026-08-26 12:42:41.916386+00', 'meetings_appointments', 'normal', '{senior_admin,director}'),
	('84367965-8b90-41fe-96a9-8f69f0ff5cd6', '1e9dba44-7c3c-4b7b-a324-69f558d489f6', 'test-brewers-supplier-regression-007', NULL, 'accounts@brewers.co.uk', 'Brewers Trade Accounts', 'Your Brewers trade account — credit terms review', 'Hi,

As part of our annual review of your ongoing trade account with us, we''d like to discuss your current credit limit and payment terms across all sites, not any single order.

Can someone from your office give us a call to go through the account relationship and confirm your preferred terms going forward?

Thanks,
Brewers Trade Accounts', NULL, '2026-08-26 11:15:00+00', NULL, NULL, 'classified', '2026-08-26 12:45:01.355741+00', 'suppliers', 'normal', '{director,senior_admin}'),
	('92479531-108f-4fd8-941b-394bf12d730b', '1e9dba44-7c3c-4b7b-a324-69f558d489f6', 'r3-before-1', NULL, 'd.whitcombe@nph.org.uk', 'Dave Whitcombe', 'Statement query', 'Morning, just going through the latest statement and one of the figures doesn''t look right — the balance shown for job 4482 is about £340 more than what we agreed. Can someone check this and get back to me?', NULL, '2026-08-26 12:00:00+00', NULL, NULL, 'classified', '2026-08-26 16:43:07.286302+00', 'finance', 'normal', '{director}'),
	('70e75bf4-113d-4043-bace-df9c54bfad46', '1e9dba44-7c3c-4b7b-a324-69f558d489f6', 'r3-before-1b', NULL, 'j.marsh@marshprops.co.uk', 'Jenny Marsh', 'Statement query', 'Morning, just going through the latest statement and one of the figures doesn''t look right — the balance shown for job 4482 is about £340 more than what we agreed. Can someone check this and get back to me?', NULL, '2026-08-26 12:00:00+00', NULL, NULL, 'classified', '2026-08-26 16:43:38.405525+00', 'accounts', 'normal', '{director}'),
	('bd927890-931f-46fb-982a-d232daa21169', '1e9dba44-7c3c-4b7b-a324-69f558d489f6', 'r3-before-2', NULL, 'karen.foster@fostersupplies.co.uk', 'Karen Foster', 'Invoice #3391', 'Hi, we''re disputing invoice #3391 — the amount charged doesn''t match the quote we were given for the materials delivered last month. Could you look into this and confirm the correct figure?', NULL, '2026-08-26 12:00:00+00', NULL, NULL, 'classified', '2026-08-26 16:44:07.280507+00', 'accounts', 'normal', '{director}'),
	('39c8a2f5-a125-4819-b2dd-51704012e7fd', '106596c5-de6f-4130-bf25-1c82fc5a9442', 'r3-before-3', NULL, 'office@allsaintsbuilders.com', 'Site Office', 'Fwd: Query re payment', 'Forwarding this below — can you take a look and respond?

---------- Forwarded message ---------
From: J. Pearson
Subject: Query re payment

Hello, I wanted to check on the status of a payment that was due to be processed for our recent works — it hasn''t shown up yet and I wanted to confirm nothing had gone wrong on your end.', NULL, '2026-08-26 12:00:00+00', NULL, NULL, 'classified', '2026-08-26 16:44:33.4295+00', 'finance', 'priority', '{director}'),
	('1ff2e17a-2cc6-4edb-99bf-468026754317', '1e9dba44-7c3c-4b7b-a324-69f558d489f6', 'test-brewers-order-003', NULL, 'orders@brewers.co.uk', 'Brewers Decorator Centres', 'Order Confirmation #BR-99213', 'Hi,

This confirms your one-off order #BR-99213 for 20L masonry paint and sundries, ready for collection from our depot on Thursday.

No account changes or ongoing terms involved — this is just the order confirmation for this single purchase.

Thanks,
Brewers Decorator Centres', NULL, '2026-08-26 10:10:00+00', NULL, NULL, 'classified', '2026-08-26 12:37:31.252253+00', 'orders', 'normal', '{senior_admin}'),
	('957ef5c0-e362-4126-859a-e179f3a0090b', '1e9dba44-7c3c-4b7b-a324-69f558d489f6', 'test-meetings-before-005', NULL, 'sarah@rosewoodproperties.co.uk', 'Sarah Rosewood', 'Meeting request — site walkthrough next week', 'Hi,

Could we arrange a meeting for next Tuesday afternoon to walk through the completed works at 45 Mill Road and discuss the snagging list?

Let me know a time that suits your team.

Thanks,
Sarah', NULL, '2026-08-26 11:00:00+00', NULL, NULL, 'classified', '2026-08-26 12:43:46.12558+00', 'meetings_appointments', 'normal', '{senior_admin,director}'),
	('dbcfc0d7-30c1-459e-9bba-71fd4bbf8310', '1e9dba44-7c3c-4b7b-a324-69f558d489f6', 'r3-retest-1', NULL, 'd.whitcombe@nph.org.uk', 'Dave Whitcombe', 'Statement query', 'Morning, just going through the latest statement and one of the figures doesn''t look right — the balance shown for job 4482 is about £340 more than what we agreed. Can someone check this and get back to me?', NULL, '2026-08-26 12:00:00+00', NULL, NULL, 'classified', '2026-08-26 16:40:25.721724+00', 'finance', 'normal', '{director}'),
	('2add9636-b6a9-47bb-a0b2-6249a002f934', '1e9dba44-7c3c-4b7b-a324-69f558d489f6', 'r3-retest-2', NULL, 'karen.foster@fostersupplies.co.uk', 'Karen Foster', 'Invoice #3391', 'Hi, we''re disputing invoice #3391 — the amount charged doesn''t match the quote we were given for the materials delivered last month. Could you look into this and confirm the correct figure?', NULL, '2026-08-26 12:00:00+00', NULL, NULL, 'classified', '2026-08-26 16:40:56.281176+00', 'invoices', 'normal', '{director}'),
	('d01023be-85bf-4b14-b166-5ece6afb8ddd', '1e9dba44-7c3c-4b7b-a324-69f558d489f6', 'msg@id001', NULL, 'mark.wilson@northamptonproperty.co.uk', 'Mark Wilson', 'Need someone at 14 High Street today', 'Hi,  We''ve just had a call from the tenant at 14 High Street. They''ve got water coming through the ceiling in the back bedroom and it seems to be getting worse.  The lads are still there at the moment but they don''t want to start taking anything apart without knowing what you want them to do.  Can someone give me a call as soon as possible please?  Thanks, Mark', NULL, '2026-08-21 13:20:00+00', 'urgent', 'senior_admin', 'sent', '2026-08-23 12:49:15.675463+00', NULL, NULL, NULL),
	('a66fb91d-7294-4339-ab65-10eba375c8b9', '1e9dba44-7c3c-4b7b-a324-69f558d489f6', 'msg@id 002', NULL, 'james.carter@riversidedevelopments.co.uk', 'James', 'Riverside – revised proposal', 'Hi,  I''ve had the revised proposal back from the client for Riverside.  They''re looking to add around £18,000 worth of work to the original contract. The numbers look reasonable from what I can see, but I haven''t agreed to anything yet.  Probably worth having a quick look before we go back to them. Let me know when you''re free and I''ll run through it with you.  Cheers, James', NULL, '2026-08-21 13:20:00+00', 'contracts', 'director', 'classified', '2026-08-23 12:54:34.980613+00', NULL, NULL, NULL),
	('b6169435-f055-4cb9-9cb9-0384be225f1d', '1e9dba44-7c3c-4b7b-a324-69f558d489f6', 'msg@id 002', NULL, 'james.carter@riversidedevelopments.co.uk', 'James', 'Riverside – revised proposal', 'Hi,

We''ve just had a call from the tenant at 14 High Street. They''ve got water coming through the ceiling in the back bedroom and it seems to be getting worse.

The lads are still there at the moment but they don''t want to start taking anything apart without knowing what you want them to do.

Can someone give me a call as soon as possible please?

Thanks,
Mark', NULL, '2026-08-21 13:20:00+00', 'urgent', 'senior_admin', 'classified', '2026-08-23 12:58:12.568192+00', NULL, NULL, NULL),
	('b4a91a1d-bfef-419e-b5d9-fe549efb9e2d', '106596c5-de6f-4130-bf25-1c82fc5a9442', 'verify-whatsapp-url-fix-20260821-003@fake.local', NULL, 'j.whitfield@northampton.gov.uk', 'Verify WhatsApp URL Fix Retest', 'URGENT - NPH job 4522: retest after publishing voice_url fix', 'This is regarding NPH job 4522 at 14 Elm Street. Retesting the WhatsApp voice_url fix after publishing the workflow. Please treat this as a same-day test.', NULL, '2026-08-21 13:20:00+00', 'nph_job_update', 'progressor', 'sent', '2026-08-22 12:40:56.104402+00', NULL, NULL, NULL);


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."users" ("id", "name", "email", "role", "whatsapp_number", "created_at") VALUES
	('ea7af488-5943-48b7-be1f-c3520f9eacb5', 'Alex Ops', 'alex.progressor@test.local', 'progressor', '07700900999', '2026-08-17 07:55:35.398485+00'),
	('dbe8ca18-844e-4064-a0fa-4a4d56e32ff5', 'tanish', '123@gmail.com', 'director', '+91 6260110569', '2026-08-16 07:14:48.58684+00');


--
-- Data for Name: drafts; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."drafts" ("id", "email_id", "ai_generated_text", "edited_text", "draft_type", "status", "approved_by", "approved_at", "sent_at", "created_at", "updated_at") VALUES
	('53c575d8-06e8-43a9-a105-b37dd93f1950', 'dbcfc0d7-30c1-459e-9bba-71fd4bbf8310', 'The balance discrepancy for job 4482 is [£340]. We are reviewing this and will confirm the correct figure by [DATE].', 'The balance discrepancy for job 4482 is [£340]. We are reviewing this and will confirm the correct figure by [DATE].', 'ai_generated', 'pending', NULL, NULL, NULL, '2026-08-26 16:40:27.582899+00', '2026-08-26 16:40:27.582899+00'),
	('081439b3-5d77-451a-b15a-82c5d6bf4275', '2add9636-b6a9-47bb-a0b2-6249a002f934', 'We are reviewing invoice #3391. Please confirm the quote amount you were given.', 'We are reviewing invoice #3391. Please confirm the quote amount you were given.', 'ai_generated', 'pending', NULL, NULL, NULL, '2026-08-26 16:40:58.447324+00', '2026-08-26 16:40:58.447324+00'),
	('738d52f9-a493-4fc8-ab44-d09fca9ec185', 'd01023be-85bf-4b14-b166-5ece6afb8ddd', 'Hi Mark,

Thank you for reaching out. I''ll arrange for someone to call you as soon as possible to discuss the situation at 14 High Street.

Best regards,

[Your Name]  
Allsaints Builders', 'Hi Mark,

Thank you for reaching out. I''ll arrange for someone to call you as soon as possible to discuss the situation at 14 High Street.

Best regards,

Tanish 
Allsaints Builders', 'ai_edited', 'sent', 'dbe8ca18-844e-4064-a0fa-4a4d56e32ff5', '2026-08-23 12:51:56.598+00', '2026-08-23 12:51:58.922+00', '2026-08-23 12:49:18.260556+00', '2026-08-23 12:51:59.043128+00'),
	('ff889776-635d-4913-a450-26bd1f885a5d', 'a66fb91d-7294-4339-ab65-10eba375c8b9', 'I will review the revised proposal for Riverside. Please send over the details, and I’ll confirm a time to discuss.', 'I will review the revised proposal for Riverside. Please send over the details, and I’ll confirm a time to discuss.', 'ai_generated', 'pending', NULL, NULL, NULL, '2026-08-23 12:54:37.210717+00', '2026-08-23 12:54:37.210717+00'),
	('176bca11-e199-404b-8698-d041e42aa957', 'b6169435-f055-4cb9-9cb9-0384be225f1d', 'Hi James,

Thank you for your email. We will address this matter urgently. I will arrange for someone to call you shortly to discuss the necessary steps.

Best regards,

[Your Name]  
Allsaints Builders', 'Hi James,

Thank you for your email. We will address this matter urgently. I will arrange for someone to call you shortly to discuss the necessary steps.

Best regards,

[Your Name]  
Allsaints Builders', 'ai_generated', 'pending', NULL, NULL, NULL, '2026-08-23 12:58:14.755972+00', '2026-08-23 12:58:14.755972+00'),
	('a937ed9b-e76d-41e4-9dd0-100cdaf782a2', '92479531-108f-4fd8-941b-394bf12d730b', 'The balance discrepancy for job 4482 is noted. We will verify and confirm the correct amount. Please expect a follow-up shortly.', 'The balance discrepancy for job 4482 is noted. We will verify and confirm the correct amount. Please expect a follow-up shortly.', 'ai_generated', 'pending', NULL, NULL, NULL, '2026-08-26 16:43:09.399867+00', '2026-08-26 16:43:09.399867+00'),
	('6ab87fce-7cdf-46ec-9cf5-5c210a0f4bfb', 'b4a91a1d-bfef-419e-b5d9-fe549efb9e2d', 'Acknowledged. The retest for NPH job 4522 at 14 Elm Street will be conducted today.', 'Acknowledged. The retest for NPH job 4522 at 14 Elm Street will be conducted today.', 'ai_generated', 'sent', 'dbe8ca18-844e-4064-a0fa-4a4d56e32ff5', '2026-08-23 13:01:03.995+00', '2026-08-23 13:01:06.698+00', '2026-08-22 12:40:57.26544+00', '2026-08-23 13:01:06.837248+00'),
	('073099df-dc5c-465e-8773-71408fdf069c', '08df1403-8e04-45d8-b927-27a752796428', 'We will send the signed PAYMENT CERT for contract ref 88213 to your address. Expect delivery by [INSERT DATE].', 'We will send the signed PAYMENT CERT for contract ref 88213 to your address. Expect delivery by [INSERT DATE].', 'ai_generated', 'pending', NULL, NULL, NULL, '2026-08-26 12:36:13.375635+00', '2026-08-26 12:36:13.375635+00'),
	('e6a59126-b9c7-4c5f-94bf-2aec31b81eda', '4d12c75f-b9b9-4bb3-a02a-8f134ff17fb3', 'Hi J. Whitfield,

Thank you for your email regarding NPH job #4521. I confirm that our crew will attend 12 Elm Street today to address the damp and mould issue.

Best regards,

[Your Name]  
Allsaints Builders', 'Hi J. Whitfield,

Thank you for your email regarding NPH job #4521. I confirm that our crew will attend 12 Elm Street today to address the damp and mould issue.

Best regards,

[Your Name]  
Allsaints Builders', 'ai_generated', 'pending', NULL, NULL, NULL, '2026-08-26 12:36:59.111401+00', '2026-08-26 12:36:59.111401+00'),
	('e26e1e7d-12d5-4aeb-8ef7-5cf50c54cd55', '1ff2e17a-2cc6-4edb-99bf-468026754317', 'Hi Brewers Decorator Centres,

Thank you for confirming order #BR-99213. We will arrange collection from your depot on Thursday.

Best regards,

[Your Name]  
Allsaints Builders', 'Hi Brewers Decorator Centres,

Thank you for confirming order #BR-99213. We will arrange collection from your depot on Thursday.

Best regards,

[Your Name]  
Allsaints Builders', 'ai_generated', 'pending', NULL, NULL, NULL, '2026-08-26 12:37:33.114105+00', '2026-08-26 12:37:33.114105+00'),
	('5e893b1d-0e89-439c-85e3-5316a675f36f', '19e673c6-b765-407f-afe4-de7fb64b2ebf', 'Please call our office at [PHONE NUMBER] to discuss the credit limit and payment terms.', 'Please call our office at [PHONE NUMBER] to discuss the credit limit and payment terms.', 'ai_generated', 'pending', NULL, NULL, NULL, '2026-08-26 12:38:19.912144+00', '2026-08-26 12:38:19.912144+00'),
	('00853b0b-2404-40b2-a629-653c1123df02', '24c38ce9-d034-4829-bfb6-d404c8b1a487', 'Hi Sarah,

Thank you for your email. We can arrange the site walkthrough for next Tuesday afternoon. Please let us know if 2:00 PM works for you, or suggest another time that suits.

Best regards,

[Your Name]  
Allsaints Builders', 'Hi Sarah,

Thank you for your email. We can arrange the site walkthrough for next Tuesday afternoon. Please let us know if 2:00 PM works for you, or suggest another time that suits.

Best regards,

[Your Name]  
Allsaints Builders', 'ai_generated', 'pending', NULL, NULL, NULL, '2026-08-26 12:42:44.505332+00', '2026-08-26 12:42:44.505332+00'),
	('87d8259e-d101-4981-9451-d20e6f01f764', '957ef5c0-e362-4126-859a-e179f3a0090b', 'Sarah,

We can meet next Tuesday afternoon at [CONFIRM TIME]. Please confirm if this suits.

Regards,

[Your Name]  
Allsaints Builders', 'Sarah,

We can meet next Tuesday afternoon at [CONFIRM TIME]. Please confirm if this suits.

Regards,

[Your Name]  
Allsaints Builders', 'ai_generated', 'pending', NULL, NULL, NULL, '2026-08-26 12:43:47.531318+00', '2026-08-26 12:43:47.531318+00'),
	('2d641677-71f9-4b01-98d2-066baf2b0885', 'c50e7b2c-11ec-43bf-912d-afaa627a3cc5', 'Please confirm the sign-off for the MINOR WORKS certificate at 22 Baker Street.', 'Please confirm the sign-off for the MINOR WORKS certificate at 22 Baker Street.', 'ai_generated', 'pending', NULL, NULL, NULL, '2026-08-26 12:44:24.682525+00', '2026-08-26 12:44:24.682525+00'),
	('bb69618c-2e1a-48b9-bb3e-f7b89bd852ed', '84367965-8b90-41fe-96a9-8f69f0ff5cd6', 'Please call Brewers Trade Accounts at your earliest convenience to discuss and confirm our credit limit and payment terms for all sites.', 'Please call Brewers Trade Accounts at your earliest convenience to discuss and confirm our credit limit and payment terms for all sites.', 'ai_generated', 'pending', NULL, NULL, NULL, '2026-08-26 12:45:03.127714+00', '2026-08-26 12:45:03.127714+00'),
	('9915120b-b0a9-427c-b640-52595ecc1a46', '70e75bf4-113d-4043-bace-df9c54bfad46', 'The balance discrepancy for job 4482 is noted. Please confirm the agreed amount, and we will review the statement. Thank you.', 'The balance discrepancy for job 4482 is noted. Please confirm the agreed amount, and we will review the statement. Thank you.', 'ai_generated', 'pending', NULL, NULL, NULL, '2026-08-26 16:43:40.972887+00', '2026-08-26 16:43:40.972887+00'),
	('237c4a58-01be-47a0-aba9-6b76cfedce9c', 'bd927890-931f-46fb-982a-d232daa21169', 'Thank you for bringing this to our attention. We will review invoice #3391 against the original quote and confirm the correct figure. Please expect a response by [INSERT DATE].', 'Thank you for bringing this to our attention. We will review invoice #3391 against the original quote and confirm the correct figure. Please expect a response by [INSERT DATE].', 'ai_generated', 'pending', NULL, NULL, NULL, '2026-08-26 16:44:09.451263+00', '2026-08-26 16:44:09.451263+00'),
	('6f74c6bd-2bb6-4382-9e83-d602d4355d86', '39c8a2f5-a125-4819-b2dd-51704012e7fd', 'The payment status is [CONFIRM STATUS]. Please verify if there were any processing issues on your end.', 'The payment status is [CONFIRM STATUS]. Please verify if there were any processing issues on your end.', 'ai_generated', 'pending', NULL, NULL, NULL, '2026-08-26 16:44:35.106196+00', '2026-08-26 16:44:35.106196+00'),
	('62e5d487-d053-4482-a70f-96418a686ca1', 'e95ca137-e5a0-4e3e-9a00-c1b4c3c0d461', 'The payment status is currently being verified. We will update you with the details by [DATE].', 'The payment status is currently being verified. We will update you with the details by [DATE].', 'ai_generated', 'discarded', NULL, NULL, NULL, '2026-08-26 16:41:35.674938+00', '2026-08-27 19:15:39.622767+00');


--
-- Data for Name: audit_log; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."audit_log" ("id", "email_id", "draft_id", "user_id", "action", "details", "created_at") VALUES
	('39039efc-e727-47fd-94d5-1ee9fc2fb29a', 'b4a91a1d-bfef-419e-b5d9-fe549efb9e2d', NULL, NULL, 'classified', '"{\"category\":\"nph_job_update\",\"routed_role\":\"progressor\",\"confidence\":98,\"summary\":\"J. Whitfield requests a same-day retest of the WhatsApp voice_url fix for NPH job 4522 at 14 Elm Street.\"}"', '2026-08-22 12:40:56.320082+00'),
	('226efbd3-610d-44fb-9a7e-22f3eb08c7d3', 'b4a91a1d-bfef-419e-b5d9-fe549efb9e2d', '6ab87fce-7cdf-46ec-9cf5-5c210a0f4bfb', NULL, 'drafted', NULL, '2026-08-22 12:40:57.374644+00'),
	('03032f2b-4680-425a-9d92-6b2037d48602', 'd01023be-85bf-4b14-b166-5ece6afb8ddd', NULL, NULL, 'classified', '"{\"category\":\"urgent\",\"routed_role\":\"senior_admin\",\"confidence\":98,\"summary\":\"Mark Wilson reports an urgent water leak at 14 High Street needing immediate guidance on how to proceed.\"}"', '2026-08-23 12:49:15.914401+00'),
	('d559de9d-5652-43eb-a583-e7935f13ca07', 'd01023be-85bf-4b14-b166-5ece6afb8ddd', NULL, NULL, 'whatsapp_skipped_no_recipient', '"{\"category\":\"urgent\",\"routed_role\":\"senior_admin\",\"reason\":\"No user with matching role or missing whatsapp_number\"}"', '2026-08-23 12:49:16.718976+00'),
	('0773eb01-ee2b-47a6-9ab4-a0bface4f6d3', 'd01023be-85bf-4b14-b166-5ece6afb8ddd', '738d52f9-a493-4fc8-ab44-d09fca9ec185', NULL, 'drafted', NULL, '2026-08-23 12:49:18.396821+00'),
	('35ea0393-b684-4305-99b7-679f713521cb', 'd01023be-85bf-4b14-b166-5ece6afb8ddd', '738d52f9-a493-4fc8-ab44-d09fca9ec185', 'dbe8ca18-844e-4064-a0fa-4a4d56e32ff5', 'approved', '{"via": "dashboard", "draft_type": "ai_edited", "approved_at": "2026-08-23T12:51:56.598Z", "was_discarded": false}', '2026-08-23 12:51:57.992682+00'),
	('61ad91dc-731f-4723-92bf-43d5f479338e', 'd01023be-85bf-4b14-b166-5ece6afb8ddd', '738d52f9-a493-4fc8-ab44-d09fca9ec185', NULL, 'sent', '"{\"to\":\"mark.wilson@northamptonproperty.co.uk\",\"account\":\"info@allsaintsbuilders.com\",\"subject\":\"Need someone at 14 High Street today\"}"', '2026-08-23 12:51:59.225463+00'),
	('b986330e-a9e1-4a8d-ba59-158c1255f256', 'a66fb91d-7294-4339-ab65-10eba375c8b9', NULL, NULL, 'classified', '"{\"category\":\"contracts\",\"routed_role\":\"director\",\"confidence\":90,\"summary\":\"James is requesting a review of a revised proposal for Riverside that includes an additional £18,000 worth of work before responding to the client.\"}"', '2026-08-23 12:54:35.142936+00'),
	('1c773d02-55c3-40e9-af2e-753808bf27c5', 'a66fb91d-7294-4339-ab65-10eba375c8b9', 'ff889776-635d-4913-a450-26bd1f885a5d', NULL, 'drafted', NULL, '2026-08-23 12:54:37.326488+00'),
	('baba5f52-4d12-472d-a1d3-a3ccd2d71d3e', 'b6169435-f055-4cb9-9cb9-0384be225f1d', NULL, NULL, 'classified', '"{\"category\":\"urgent\",\"routed_role\":\"senior_admin\",\"confidence\":98,\"summary\":\"Mark from Riverside Developments reports an urgent water leak at 14 High Street and requests immediate guidance on how to proceed.\"}"', '2026-08-23 12:58:12.677939+00'),
	('6f76eb56-865b-4be5-8164-87b511ccfbd5', 'b6169435-f055-4cb9-9cb9-0384be225f1d', NULL, NULL, 'whatsapp_skipped_no_recipient', '"{\"category\":\"urgent\",\"routed_role\":\"senior_admin\",\"reason\":\"No user with matching role or missing whatsapp_number\"}"', '2026-08-23 12:58:13.058172+00'),
	('eea57683-2289-41ed-9f04-899ca56bcadc', 'b6169435-f055-4cb9-9cb9-0384be225f1d', '176bca11-e199-404b-8698-d041e42aa957', NULL, 'drafted', NULL, '2026-08-23 12:58:14.880674+00'),
	('0c0e2018-ed28-4537-89d7-d04f37172af6', 'b4a91a1d-bfef-419e-b5d9-fe549efb9e2d', '6ab87fce-7cdf-46ec-9cf5-5c210a0f4bfb', 'dbe8ca18-844e-4064-a0fa-4a4d56e32ff5', 'approved', '{"via": "voice", "draft_type": "ai_generated", "approved_at": "2026-08-23T13:01:03.995Z", "was_discarded": false}', '2026-08-23 13:01:04.924942+00'),
	('08d28228-1eef-4b6e-96db-ca0869795319', 'b4a91a1d-bfef-419e-b5d9-fe549efb9e2d', '6ab87fce-7cdf-46ec-9cf5-5c210a0f4bfb', NULL, 'sent', '"{\"to\":\"j.whitfield@northampton.gov.uk\",\"account\":\"team@allsaintsbuilders.com\",\"subject\":\"URGENT - NPH job 4522: retest after publishing voice_url fix\"}"', '2026-08-23 13:01:07.099687+00'),
	('3c380240-9eb2-4288-8a3f-642f275d42d2', '08df1403-8e04-45d8-b927-27a752796428', NULL, NULL, 'classified', '"{\"theme\":\"finance\",\"urgency\":\"priority\",\"routed_roles\":[\"director\"],\"confidence\":1,\"summary\":\"NPH AD Finance is requesting a signed PAYMENT CERT for an overdue invoice related to contract ref 88213.\"}"', '2026-08-26 12:36:11.380747+00'),
	('70492b6d-ef14-4f5a-aa6c-6a187853592c', '08df1403-8e04-45d8-b927-27a752796428', '073099df-dc5c-465e-8773-71408fdf069c', NULL, 'drafted', NULL, '2026-08-26 12:36:13.496617+00'),
	('409b576b-4b17-46ab-bb60-1c296376c13a', '4d12c75f-b9b9-4bb3-a02a-8f134ff17fb3', NULL, NULL, 'classified', '"{\"theme\":\"nph_jobs\",\"urgency\":\"urgent\",\"routed_roles\":[\"senior_admin\"],\"confidence\":1,\"summary\":\"Urgent NPH job for emergency damp and mould repair at 12 Elm Street requiring same-day attendance.\"}"', '2026-08-26 12:36:52.123647+00'),
	('9c18df50-78d1-4efc-8f13-61483a5f127d', '4d12c75f-b9b9-4bb3-a02a-8f134ff17fb3', 'e6a59126-b9c7-4c5f-94bf-2aec31b81eda', NULL, 'drafted', NULL, '2026-08-26 12:36:59.210011+00'),
	('0cc5f759-a898-4ecc-9498-8c58ac847c24', '1ff2e17a-2cc6-4edb-99bf-468026754317', NULL, NULL, 'classified', '"{\"theme\":\"orders\",\"urgency\":\"normal\",\"routed_roles\":[\"senior_admin\"],\"confidence\":1,\"summary\":\"Order confirmation from Brewers for 20L masonry paint, ready for collection.\"}"', '2026-08-26 12:37:31.320538+00'),
	('58dbd69c-7b1b-4429-a30b-e2a2db7a33d7', '1ff2e17a-2cc6-4edb-99bf-468026754317', 'e26e1e7d-12d5-4aeb-8ef7-5cf50c54cd55', NULL, 'drafted', NULL, '2026-08-26 12:37:33.218921+00'),
	('a67b776b-f872-4799-bc69-d26c82bda8e3', '19e673c6-b765-407f-afe4-de7fb64b2ebf', NULL, NULL, 'classified', '"{\"theme\":\"suppliers\",\"urgency\":\"normal\",\"routed_roles\":[\"director\",\"senior_admin\"],\"confidence\":1,\"summary\":\"Brewers wants to discuss the credit limit and payment terms for Allsaints Builders'' trade account.\"}"', '2026-08-26 12:38:18.783929+00'),
	('9336dac8-aa0f-4325-89b1-fd5e004b3710', '19e673c6-b765-407f-afe4-de7fb64b2ebf', '5e893b1d-0e89-439c-85e3-5316a675f36f', NULL, 'drafted', NULL, '2026-08-26 12:38:19.977913+00'),
	('60cadb1e-40e6-4892-93ac-b96239f6beb8', '24c38ce9-d034-4829-bfb6-d404c8b1a487', NULL, NULL, 'classified', '"{\"theme\":\"meetings_appointments\",\"urgency\":\"normal\",\"routed_roles\":[\"senior_admin\",\"director\"],\"confidence\":1,\"summary\":\"Sarah Rosewood is requesting a meeting next Tuesday for a site walkthrough and snagging list discussion.\"}"', '2026-08-26 12:42:42.090257+00'),
	('5fd1a85b-4482-4d27-bcc6-c101d5b27e4e', '24c38ce9-d034-4829-bfb6-d404c8b1a487', '00853b0b-2404-40b2-a629-653c1123df02', NULL, 'drafted', NULL, '2026-08-26 12:42:44.612428+00'),
	('56942971-aa39-4046-830e-1e9a94e36d1b', '957ef5c0-e362-4126-859a-e179f3a0090b', NULL, NULL, 'classified', '"{\"theme\":\"meetings_appointments\",\"urgency\":\"normal\",\"routed_roles\":[\"senior_admin\",\"director\"],\"confidence\":1,\"summary\":\"Sarah Rosewood is requesting a meeting next Tuesday for a site walkthrough and snagging list discussion.\"}"', '2026-08-26 12:43:46.229828+00'),
	('6627d1b4-f5ad-46c3-bd8a-82325f283b23', '957ef5c0-e362-4126-859a-e179f3a0090b', '87d8259e-d101-4981-9451-d20e6f01f764', NULL, 'drafted', NULL, '2026-08-26 12:43:47.649162+00'),
	('5b4e4ffd-4553-41ea-913a-d7305a3adbaf', 'c50e7b2c-11ec-43bf-912d-afaa627a3cc5', NULL, NULL, 'classified', '"{\"theme\":\"certificates\",\"urgency\":\"priority\",\"routed_roles\":[\"senior_admin\",\"director\"],\"confidence\":1,\"summary\":\"The email contains a completed MINOR WORKS certificate for electrical work at 22 Baker Street, requiring sign-off.\"}"', '2026-08-26 12:44:23.386406+00'),
	('ddd36e15-3027-432b-aefe-5dba0bbd47dd', 'c50e7b2c-11ec-43bf-912d-afaa627a3cc5', '2d641677-71f9-4b01-98d2-066baf2b0885', NULL, 'drafted', NULL, '2026-08-26 12:44:25.011214+00'),
	('4b53c163-a37e-4385-b19a-ed83c670c013', '84367965-8b90-41fe-96a9-8f69f0ff5cd6', NULL, NULL, 'classified', '"{\"theme\":\"suppliers\",\"urgency\":\"normal\",\"routed_roles\":[\"director\",\"senior_admin\"],\"confidence\":1,\"summary\":\"Brewers is requesting a discussion about the credit terms and payment conditions for Allsaints Builders'' trade account.\"}"', '2026-08-26 12:45:01.449136+00'),
	('fd724939-eed0-4555-9d68-8742dda1445a', '84367965-8b90-41fe-96a9-8f69f0ff5cd6', 'bb69618c-2e1a-48b9-bb3e-f7b89bd852ed', NULL, 'drafted', NULL, '2026-08-26 12:45:03.28639+00'),
	('a0e1b7c7-2b32-4691-98e3-81ad1df34bb5', 'c50e7b2c-11ec-43bf-912d-afaa627a3cc5', NULL, NULL, 'whatsapp_skipped_no_recipient', '"{\"role\":\"senior_admin\",\"urgency\":\"urgent\",\"reason\":\"No user with matching role or missing whatsapp_number\"}"', '2026-08-26 13:06:43.599189+00'),
	('a5e3fb3d-d2fd-45de-9fa1-453e43231a7c', 'c50e7b2c-11ec-43bf-912d-afaa627a3cc5', NULL, NULL, 'whatsapp_skipped_no_recipient', '"{\"role\":\"accountant\",\"urgency\":\"urgent\",\"reason\":\"No user with matching role or missing whatsapp_number\"}"', '2026-08-26 13:06:43.599189+00'),
	('8cd13308-69d7-4bf8-a7e1-995195a603cf', 'dbcfc0d7-30c1-459e-9bba-71fd4bbf8310', NULL, NULL, 'classified', '"{\"theme\":\"finance\",\"urgency\":\"normal\",\"routed_roles\":[\"director\"],\"confidence\":1,\"summary\":\"Dave Whitcombe from NPH queries a discrepancy in the balance for job 4482 on the latest statement.\"}"', '2026-08-26 16:40:25.994879+00'),
	('e0ef80ac-7d97-476e-bead-c6afdf24345e', 'dbcfc0d7-30c1-459e-9bba-71fd4bbf8310', '53c575d8-06e8-43a9-a105-b37dd93f1950', NULL, 'drafted', NULL, '2026-08-26 16:40:27.712173+00'),
	('411633a4-f070-4c44-8d6a-cd8974bd7f9f', '2add9636-b6a9-47bb-a0b2-6249a002f934', NULL, NULL, 'classified', '"{\"theme\":\"invoices\",\"urgency\":\"normal\",\"routed_roles\":[\"director\"],\"confidence\":1,\"summary\":\"Karen Foster is disputing the amount charged on invoice #3391 and requests confirmation of the correct figure.\"}"', '2026-08-26 16:40:56.404882+00'),
	('9d4c824c-1c34-4edf-95bb-e16885dd0527', '2add9636-b6a9-47bb-a0b2-6249a002f934', '081439b3-5d77-451a-b15a-82c5d6bf4275', NULL, 'drafted', NULL, '2026-08-26 16:40:58.633367+00'),
	('7d1444a8-8e11-4190-a077-5fd4344e5446', 'e95ca137-e5a0-4e3e-9a00-c1b4c3c0d461', NULL, NULL, 'classified', '"{\"theme\":\"finance\",\"urgency\":\"normal\",\"routed_roles\":[\"director\"],\"confidence\":1,\"summary\":\"A query about the status of a payment for recent works that hasn''t been received yet.\"}"', '2026-08-26 16:41:34.17033+00'),
	('31bf51eb-0cc8-4f32-9b2b-664d158576c3', 'e95ca137-e5a0-4e3e-9a00-c1b4c3c0d461', '62e5d487-d053-4482-a70f-96418a686ca1', NULL, 'drafted', NULL, '2026-08-26 16:41:35.81753+00'),
	('39db4c8d-cea4-44c7-adcd-7e09d8b6dbcb', '92479531-108f-4fd8-941b-394bf12d730b', NULL, NULL, 'classified', '"{\"theme\":\"finance\",\"urgency\":\"normal\",\"routed_roles\":[\"director\"],\"confidence\":0.9,\"summary\":\"Dave Whitcombe from NPH is querying a discrepancy in the balance for job 4482 on the latest statement.\"}"', '2026-08-26 16:43:07.412764+00'),
	('dcf770fd-99ac-4999-809c-51bda10d087b', '92479531-108f-4fd8-941b-394bf12d730b', 'a937ed9b-e76d-41e4-9dd0-100cdaf782a2', NULL, 'drafted', NULL, '2026-08-26 16:43:09.464167+00'),
	('1e13f7d9-f40f-4b9e-b817-c581eda72757', '70e75bf4-113d-4043-bace-df9c54bfad46', NULL, NULL, 'classified', '"{\"theme\":\"accounts\",\"urgency\":\"normal\",\"routed_roles\":[\"director\"],\"confidence\":0.9,\"summary\":\"Jenny Marsh is querying a discrepancy in the balance for job 4482 on the latest statement.\"}"', '2026-08-26 16:43:38.513286+00'),
	('43bf3f14-81b3-4ca4-909b-588158a902e2', '70e75bf4-113d-4043-bace-df9c54bfad46', '9915120b-b0a9-427c-b640-52595ecc1a46', NULL, 'drafted', NULL, '2026-08-26 16:43:41.127138+00'),
	('40c761cb-3100-42c7-8017-fbe1937020c2', 'bd927890-931f-46fb-982a-d232daa21169', NULL, NULL, 'classified', '"{\"theme\":\"accounts\",\"urgency\":\"normal\",\"routed_roles\":[\"director\"],\"confidence\":0.8,\"summary\":\"Karen Foster is disputing an invoice amount that doesn''t match the quoted price for materials delivered last month.\"}"', '2026-08-26 16:44:07.360529+00'),
	('f3996597-2048-42c1-acaa-4fdd65853aea', 'bd927890-931f-46fb-982a-d232daa21169', '237c4a58-01be-47a0-aba9-6b76cfedce9c', NULL, 'drafted', NULL, '2026-08-26 16:44:09.528305+00'),
	('dd7ce3af-29e6-4528-aa96-dc6f79634c2d', '39c8a2f5-a125-4819-b2dd-51704012e7fd', NULL, NULL, 'classified', '"{\"theme\":\"finance\",\"urgency\":\"priority\",\"routed_roles\":[\"director\"],\"confidence\":0.9,\"summary\":\"A forwarded email querying the status of a payment for recent works that hasn''t been processed yet.\"}"', '2026-08-26 16:44:33.492481+00'),
	('19b91500-73eb-4cd6-816f-b1f98365fa04', '39c8a2f5-a125-4819-b2dd-51704012e7fd', '6f74c6bd-2bb6-4382-9e83-d602d4355d86', NULL, 'drafted', NULL, '2026-08-26 16:44:35.166683+00'),
	('e68e8f81-9f5d-45f0-b1fc-4e5d28d838f5', 'e95ca137-e5a0-4e3e-9a00-c1b4c3c0d461', '62e5d487-d053-4482-a70f-96418a686ca1', NULL, 'discarded', '{"via": "voice", "discarded_at": "2026-08-27T19:15:39.802Z"}', '2026-08-27 19:15:39.942637+00');


--
-- Data for Name: buckets; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: buckets_analytics; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: buckets_vectors; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: objects; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: s3_multipart_uploads; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: s3_multipart_uploads_parts; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: vector_indexes; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE SET; Schema: auth; Owner: supabase_auth_admin
--

SELECT pg_catalog.setval('"auth"."refresh_tokens_id_seq"', 30, true);


--
-- PostgreSQL database dump complete
--

-- \unrestrict UEYDavza4ze0EcoghQUKQOFplwfWSXWYtbh6E5necYVVXB0Orrj2QT9ALhIuSXU

RESET ALL;
