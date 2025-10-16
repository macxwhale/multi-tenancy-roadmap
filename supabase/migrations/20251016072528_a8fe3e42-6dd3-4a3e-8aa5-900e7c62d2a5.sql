-- Create notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('invoice', 'payment', 'client', 'product', 'system')),
  read BOOLEAN NOT NULL DEFAULT false,
  link TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Create policies for notifications
CREATE POLICY "Users can view their own notifications" 
ON public.notifications 
FOR SELECT 
USING (tenant_id = get_user_tenant_id() AND user_id = auth.uid());

CREATE POLICY "Users can insert their own notifications" 
ON public.notifications 
FOR INSERT 
WITH CHECK (tenant_id = get_user_tenant_id() AND user_id = auth.uid());

CREATE POLICY "Users can update their own notifications" 
ON public.notifications 
FOR UPDATE 
USING (tenant_id = get_user_tenant_id() AND user_id = auth.uid());

CREATE POLICY "Users can delete their own notifications" 
ON public.notifications 
FOR DELETE 
USING (tenant_id = get_user_tenant_id() AND user_id = auth.uid());

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_notifications_updated_at
BEFORE UPDATE ON public.notifications
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster queries
CREATE INDEX idx_notifications_user_tenant ON public.notifications(user_id, tenant_id, created_at DESC);
CREATE INDEX idx_notifications_read ON public.notifications(read, created_at DESC);

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;