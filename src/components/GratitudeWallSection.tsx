import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart, Sparkles } from "lucide-react";
import { GratitudeMessage } from "./GratitudeMessage";
import { useGratitudeWall } from "@/hooks/useGratitudeWall";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";

export const GratitudeWallSection = () => {
  const { messages, loading, addReaction } = useGratitudeWall(5);

  if (loading) {
    return (
      <Card className="backdrop-blur-sm border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Heart className="h-5 w-5 text-primary" />
            Mur de Gratitude
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (messages.length === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
    >
      <Card className="backdrop-blur-sm border-border/50 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-primary/10 via-secondary/10 to-accent/10">
          <CardTitle className="flex items-center gap-2 text-xl">
            <div className="p-2 rounded-full bg-primary/10">
              <Heart className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span>Mur de Gratitude</span>
                <Sparkles className="h-4 w-4 text-yellow-500" />
              </div>
              <p className="text-xs font-normal text-muted-foreground mt-1">
                Célébrons ensemble la générosité de notre communauté
              </p>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <AnimatePresence mode="popLayout">
            <div className="space-y-3">
              {messages.map((message) => (
                <GratitudeMessage
                  key={message.id}
                  message={message}
                  onAddReaction={addReaction}
                />
              ))}
            </div>
          </AnimatePresence>

          {messages.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-center mt-4"
            >
              <p className="text-xs text-muted-foreground">
                💝 {messages.length} message{messages.length > 1 ? 's' : ''} de gratitude récent{messages.length > 1 ? 's' : ''}
              </p>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};
