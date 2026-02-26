INSERT INTO contact_relationships (user_a, user_b, relationship_type, can_see_funds, can_see_events)
VALUES ('0b4eb0bb-96dd-4a9d-b7f1-96eaafea95d4', 'aae8fedd-8b84-4434-bf18-a7b8e78ffab5', 'friend', true, true)
ON CONFLICT DO NOTHING;