
CREATE POLICY "memories public read" ON storage.objects FOR SELECT USING (bucket_id = 'memories');
CREATE POLICY "memories auth upload" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'memories' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "memories owner delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'memories' AND auth.uid()::text = (storage.foldername(name))[1]);
