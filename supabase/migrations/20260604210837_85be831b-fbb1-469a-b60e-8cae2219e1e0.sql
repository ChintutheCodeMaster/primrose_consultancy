
CREATE POLICY "Public read student-portal-docs" ON storage.objects FOR SELECT USING (bucket_id = 'student-portal-docs');
CREATE POLICY "Public upload student-portal-docs" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'student-portal-docs');
CREATE POLICY "Public update student-portal-docs" ON storage.objects FOR UPDATE USING (bucket_id = 'student-portal-docs');
CREATE POLICY "Public delete student-portal-docs" ON storage.objects FOR DELETE USING (bucket_id = 'student-portal-docs');
