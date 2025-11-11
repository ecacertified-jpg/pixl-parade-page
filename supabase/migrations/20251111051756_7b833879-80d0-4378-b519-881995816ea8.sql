-- Table pour stocker l'historique des conversations
CREATE TABLE ai_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  
  -- Contexte de la conversation
  conversation_stage TEXT DEFAULT 'discovery' CHECK (conversation_stage IN (
    'discovery',
    'onboarding',
    'setup_profile',
    'add_friends',
    'preferences',
    'using_features',
    'advanced'
  )),
  
  -- Métadonnées
  current_page TEXT,
  user_intent TEXT,
  last_topic TEXT,
  
  -- Statistiques
  messages_count INTEGER DEFAULT 0,
  helpful_responses INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  last_message_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_ai_conversations_user_id ON ai_conversations(user_id);
CREATE INDEX idx_ai_conversations_session_id ON ai_conversations(session_id);
CREATE INDEX idx_ai_conversations_stage ON ai_conversations(conversation_stage);

-- RLS
ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own conversations"
  ON ai_conversations FOR SELECT
  USING (user_id = auth.uid() OR user_id IS NULL);

CREATE POLICY "Anyone can insert conversations"
  ON ai_conversations FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update their own conversations"
  ON ai_conversations FOR UPDATE
  USING (user_id = auth.uid() OR user_id IS NULL);

-- Table pour stocker les messages détaillés
CREATE TABLE ai_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES ai_conversations(id) ON DELETE CASCADE,
  
  -- Contenu du message
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  
  -- Contexte au moment du message
  page_context TEXT,
  user_state JSONB DEFAULT '{}',
  
  -- Metadata
  tokens_used INTEGER,
  response_time_ms INTEGER,
  
  -- Feedback utilisateur
  was_helpful BOOLEAN,
  feedback_text TEXT,
  
  -- Timestamp
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_ai_messages_conversation_id ON ai_messages(conversation_id);
CREATE INDEX idx_ai_messages_created_at ON ai_messages(created_at DESC);

-- RLS
ALTER TABLE ai_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view messages of their conversations"
  ON ai_messages FOR SELECT
  USING (
    conversation_id IN (
      SELECT id FROM ai_conversations WHERE user_id = auth.uid() OR user_id IS NULL
    )
  );

CREATE POLICY "Anyone can insert messages"
  ON ai_messages FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update message feedback"
  ON ai_messages FOR UPDATE
  USING (
    conversation_id IN (
      SELECT id FROM ai_conversations WHERE user_id = auth.uid() OR user_id IS NULL
    )
  );

-- Table pour la base de connaissances
CREATE TABLE ai_knowledge_base (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Organisation
  category TEXT NOT NULL CHECK (category IN (
    'features',
    'onboarding',
    'friends',
    'preferences',
    'funds',
    'gifts',
    'business',
    'faq'
  )),
  
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  keywords TEXT[],
  
  -- Métriques
  usage_count INTEGER DEFAULT 0,
  helpfulness_score NUMERIC(3,2) DEFAULT 0,
  
  -- Contrôle
  is_active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_ai_knowledge_base_category ON ai_knowledge_base(category);
CREATE INDEX idx_ai_knowledge_base_keywords ON ai_knowledge_base USING GIN(keywords);
CREATE INDEX idx_ai_knowledge_base_active ON ai_knowledge_base(is_active) WHERE is_active = true;

-- Peupler la base de connaissances avec des questions/réponses initiales
INSERT INTO ai_knowledge_base (category, question, answer, keywords, priority) VALUES
('features', 'Quels sont les services de JOIE DE VIVRE ?', 
'JOIE DE VIVRE propose plusieurs services :

🎁 **Cadeaux** : Commandez des cadeaux pour vous ou vos proches
💰 **Cagnottes collaboratives** : Créez des collectes pour offrir un cadeau ensemble
❤️ **Liste de souhaits** : Configurez vos préférences pour recevoir les cadeaux qui vous plaisent
👥 **Cercle d''amis** : Ajoutez vos proches pour partager des moments de bonheur
🎉 **Célébrations** : Anniversaires, promotions, mariages, naissances...',
ARRAY['services', 'fonctionnalités', 'que faire', 'utiliser'], 10),

('features', 'C''est gratuit ?',
'✅ L''inscription et l''utilisation de JOIE DE VIVRE sont **100% gratuites** !

Vous ne payez que lorsque vous :
- Commandez un cadeau
- Contribuez à une cagnotte

Aucun abonnement, aucun frais cachés. 😊',
ARRAY['gratuit', 'prix', 'coût', 'payant', 'tarif'], 9),

('onboarding', 'Comment m''inscrire ?',
'L''inscription est simple :

1️⃣ Cliquez sur "S''inscrire"
2️⃣ Entrez votre prénom
3️⃣ Ajoutez votre date d''anniversaire (pour recevoir des cadeaux !)
4️⃣ Indiquez votre ville
5️⃣ Entrez votre numéro de téléphone ivoirien (+225...)
6️⃣ Validez avec le code SMS reçu

Et voilà ! Vous êtes prêt à célébrer ! 🎉',
ARRAY['inscription', 's''inscrire', 'créer compte', 'nouveau'], 10),

('friends', 'Pourquoi ajouter des amis ?',
'Ajouter des amis est **essentiel** sur JOIE DE VIVRE :

✨ **Pour vous** :
- Recevoir des cadeaux lors de votre anniversaire
- Vos amis pourront créer des cagnottes pour vous
- Être informé de leurs événements importants

✨ **Pour vos amis** :
- Leur offrir des cadeaux facilement
- Participer à des cagnottes communes
- Célébrer leurs moments de bonheur

Plus vous avez d''amis, plus vous partagez de moments de joie ! 💝',
ARRAY['amis', 'contacts', 'cercle', 'ajouter amis'], 10),

('friends', 'Comment ajouter des amis ?',
'C''est très simple :

1️⃣ Allez dans **Mon Tableau de Bord**
2️⃣ Cliquez sur l''onglet **"Amis"**
3️⃣ Appuyez sur le bouton **"Ajouter"** (+)
4️⃣ Remplissez les informations :
   - Nom complet
   - Numéro de téléphone
   - Date d''anniversaire
   - Relation (ami, famille, collègue...)
   - Ville
5️⃣ Validez !

💡 **Astuce** : Si votre ami est déjà inscrit, vous serez automatiquement connectés !',
ARRAY['ajouter amis', 'nouveau contact', 'inviter'], 9),

('preferences', 'Pourquoi configurer mes préférences ?',
'Vos préférences aident vos amis à choisir les **meilleurs cadeaux** pour vous !

📏 **Tailles** : Vêtements, chaussures
🚫 **Allergies** : Alimentaires, cosmétiques
🎨 **Couleurs** : Vos couleurs préférées et celles à éviter
💰 **Budget** : Fourchettes de prix selon les occasions
🔒 **Confidentialité** : Qui peut voir vos préférences

➡️ Un profil complet = des cadeaux qui vous plaisent vraiment ! 🎁',
ARRAY['préférences', 'profil', 'paramètres', 'configuration'], 10),

('funds', 'Comment créer une cagnotte ?',
'Pour créer une cagnotte collaborative :

1️⃣ Allez dans votre **Dashboard**
2️⃣ Cliquez sur **"Créer une cagnotte"**
3️⃣ Choisissez :
   - Le bénéficiaire (un de vos amis)
   - L''occasion (anniversaire, promotion...)
   - Le montant cible
   - Un message personnalisé
   - Visibilité (publique ou privée)
4️⃣ Validez !

Vos amis pourront ensuite contribuer à votre cagnotte ! 💰',
ARRAY['cagnotte', 'créer', 'collecte', 'fonds'], 9),

('funds', 'Comment contribuer à une cagnotte ?',
'Pour contribuer à une cagnotte :

1️⃣ Trouvez la cagnotte dans votre **Dashboard**
2️⃣ Cliquez sur **"Contribuer"**
3️⃣ Entrez le montant que vous souhaitez donner
4️⃣ Ajoutez un message (optionnel)
5️⃣ Choisissez si vous voulez être anonyme ou non
6️⃣ Validez !

Le créateur et le bénéficiaire seront notifiés de votre générosité ! ❤️',
ARRAY['contribuer', 'participer', 'donner', 'cotiser'], 9),

('gifts', 'Comment commander un cadeau ?',
'Pour commander un cadeau :

1️⃣ Allez dans l''onglet **"Shop"**
2️⃣ Parcourez les produits
3️⃣ Cliquez sur un produit qui vous plaît
4️⃣ Choisissez **"Commander pour moi"** ou **"Commander pour quelqu''un"**
5️⃣ Ajoutez au panier
6️⃣ Passez la commande !

Le cadeau sera livré à l''adresse choisie ! 🎁',
ARRAY['commander', 'acheter', 'cadeau', 'shop'], 8);