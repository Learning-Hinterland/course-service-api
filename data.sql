     SELECT comments.*
            FROM comments
            INNER JOIN course_material_contents ON course_material_contents.id = comments.content_id
            INNER JOIN course_materials ON course_materials.id = contents.lesson_id
            INNER JOIN users ON users.id = comments.user_id
        WHERE course_materials.course_id = 1
        ORDER BY comments.date;