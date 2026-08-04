package com.blooddonation.entity;

public enum BloodGroup {
    A_POSITIVE("A+"),
    A_NEGATIVE("A-"),
    B_POSITIVE("B+"),
    B_NEGATIVE("B-"),
    AB_POSITIVE("AB+"),
    AB_NEGATIVE("AB-"),
    O_POSITIVE("O+"),
    O_NEGATIVE("O-");

    private final String value;

    BloodGroup(String value) {
        this.value = value;
    }

    public String getValue() {
        return value;
    }

    public static BloodGroup fromString(String text) {
        if (text == null) return null;
        for (BloodGroup bg : BloodGroup.values()) {
            if (bg.value.equalsIgnoreCase(text) || bg.name().equalsIgnoreCase(text)) {
                return bg;
            }
        }
        throw new IllegalArgumentException("Unknown Blood Group: " + text);
    }
}
