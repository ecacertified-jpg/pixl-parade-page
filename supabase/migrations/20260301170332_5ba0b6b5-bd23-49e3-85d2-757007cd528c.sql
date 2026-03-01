INSERT INTO contact_relationships (user_a, user_b, can_see_funds, relationship_type)
VALUES ('0b4eb0bb-96dd-4a9d-b7f1-96eaafea95d4', '3fc4a030-46ca-44f7-92d8-eb2d70e1610e', true, 'friend')
ON CONFLICT DO NOTHING;