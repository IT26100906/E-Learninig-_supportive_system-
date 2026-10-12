package com.elearning.model;

public class Material {

        private String materialId;
        private String title;
        private String topic;
        private String link;

        public Material(String materialId, String title,
                        String topic, String link) {

            this.materialId = materialId;
            this.title = title;
            this.topic = topic;
            this.link = link;
        }

        public String getMaterialId() {
            return materialId;
        }

        public String getTitle() {
            return title;
        }

        public String getTopic() {
            return topic;
        }

        public String getLink() {
            return link;
        }
}

