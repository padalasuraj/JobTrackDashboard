package com.jobtrack;

import jakarta.validation.Constraint;
import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;
import jakarta.validation.Payload;
import java.lang.annotation.*;
import java.net.URI;
import java.util.Set;

@Target({ElementType.FIELD, ElementType.PARAMETER, ElementType.RECORD_COMPONENT})
@Retention(RetentionPolicy.RUNTIME)
@Constraint(validatedBy = HttpUrl.Validator.class)
@interface HttpUrl {
    String message() default "Use a complete http:// or https:// link.";
    Class<?>[] groups() default {};
    Class<? extends Payload>[] payload() default {};
    class Validator implements ConstraintValidator<HttpUrl, String> {
        @Override public boolean isValid(String value, ConstraintValidatorContext context) {
            if (value == null || value.isBlank()) return true;
            try {
                URI uri = URI.create(value);
                return uri.getScheme() != null && Set.of("http", "https").contains(uri.getScheme().toLowerCase(java.util.Locale.ROOT)) && uri.getHost() != null
                    && !uri.getHost().isBlank() && uri.getUserInfo() == null;
            } catch (IllegalArgumentException ex) { return false; }
        }
    }
}
